import { Response, NextFunction } from 'express';
import { Conversation, Message } from '../models/chat.model';
import { User } from '../models/user.model';
import { CustomRequest } from '../types';
import { getIO } from '../services/socket.service';
import { createNotification } from '../services/notification.service';
import CustomError from '../utils/customError';

export const createConversation = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const { recipientId, listingId, rentalRequestId } = req.body;

    if (recipientId === req.user._id.toString()) {
      throw new CustomError('You cannot start a conversation with yourself', 400, 'SELF_CONVERSATION_PROHIBITED');
    }

    // Check recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      throw new CustomError('Recipient user not found', 404, 'NOT_FOUND');
    }

    // Check if conversation already exists for this listing and participant pair
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, recipientId] },
      listing: listingId || null,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, recipientId],
        listing: listingId || undefined,
        rentalRequest: rentalRequestId || undefined,
      });
    }

    const populatedConvo = await Conversation.findById(conversation._id)
      .populate('participants', 'fullName avatar ratingAverage isBlocked')
      .populate('listing', 'title images rentalPrice priceUnit status')
      .populate('lastMessage');

    return res.status(201).json({
      success: true,
      conversation: populatedConvo,
    });
  } catch (error) {
    return next(error);
  }
};

export const getConversations = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'fullName avatar ratingAverage isBlocked')
      .populate('listing', 'title images rentalPrice priceUnit')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    return res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    return next(error);
  }
};

export const getMessages = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      throw new CustomError('Conversation not found', 404, 'NOT_FOUND');
    }

    // Verify membership
    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user!._id.toString()
    );
    if (!isParticipant) {
      throw new CustomError('You are not authorized to access this conversation', 403, 'FORBIDDEN');
    }

    const messages = await Message.find({ conversation: conversation._id })
      .sort({ createdAt: 1 }) // oldest first
      .populate('sender', 'fullName avatar');

    return res.json({
      success: true,
      messages,
    });
  } catch (error) {
    return next(error);
  }
};

export const sendMessage = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const { text } = req.body;
    if (!text || text.trim() === '') {
      throw new CustomError('Message content is required', 400, 'BAD_REQUEST');
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      throw new CustomError('Conversation not found', 404, 'NOT_FOUND');
    }

    // Verify membership
    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user!._id.toString()
    );
    if (!isParticipant) {
      throw new CustomError('You are not authorized to send messages here', 403, 'FORBIDDEN');
    }

    // Verify that recipient is not blocked and user themselves isn't blocked
    const otherParticipantId = conversation.participants.find(
      p => p.toString() !== req.user!._id.toString()
    );

    const otherUser = await User.findById(otherParticipantId);
    if (otherUser && otherUser.isBlocked) {
      throw new CustomError('Cannot send message: Recipient account is blocked', 400, 'RECIPIENT_BLOCKED');
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      text: text.trim(),
    });

    // Update conversation lastMessage and timestamp
    conversation.lastMessage = message._id as any;
    await conversation.save();

    // Populate message sender
    const populatedMessage = await message.populate('sender', 'fullName avatar');

    // Broadcast message via Socket.IO room
    const io = getIO();
    if (io) {
      io.to(conversation._id.toString()).emit('receiveMessage', populatedMessage);
      console.log(`[Socket.IO] Broadcasted message to conversation room: ${conversation._id}`);
    }

    // Send direct live notification to other user
    if (otherParticipantId) {
      await createNotification(
        otherParticipantId,
        'NEW_MESSAGE',
        `New Message from ${req.user.fullName}`,
        text.substring(0, 60) + (text.length > 60 ? '...' : ''),
        conversation._id
      );
    }

    return res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    return next(error);
  }
};

export const markAsRead = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      throw new CustomError('Conversation not found', 404, 'NOT_FOUND');
    }

    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user!._id.toString()
    );
    if (!isParticipant) {
      throw new CustomError('You are not authorized', 403, 'FORBIDDEN');
    }

    // Mark messages as read where sender is not the current user and readAt is undefined
    const readAtDate = new Date();
    await Message.updateMany(
      {
        conversation: conversation._id,
        sender: { $ne: req.user._id },
        readAt: { $exists: false },
      },
      {
        $set: { readAt: readAtDate },
      }
    );

    // Relay read receipt event via sockets
    const io = getIO();
    if (io) {
      io.to(conversation._id.toString()).emit('messagesMarkedRead', {
        conversationId: conversation._id,
        readAt: readAtDate,
      });
    }

    return res.json({
      success: true,
      message: 'Conversation messages marked as read',
    });
  } catch (error) {
    return next(error);
  }
};
