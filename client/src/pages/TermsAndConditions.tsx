import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Scale, Landmark, ArrowLeft, KeyRound, Handshake } from 'lucide-react';

export const TermsAndConditions: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Top Breadcrumb / Back button */}
      <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 dark:text-slate-400">
        <Link to="/" className="hover:text-[#9E1B1B] dark:hover:text-red-400 flex items-center gap-1 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </Link>
        <span>/</span>
        <span className="text-slate-800 dark:text-slate-200">Terms & Conditions</span>
      </div>

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#9E1B1B]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 px-3.5 py-1.5 rounded-full text-xs font-bold font-display">
            <Scale className="h-4 w-4" />
            <span>NIET Campus Exchange Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display text-slate-900 dark:text-white tracking-tight">
            Terms & Conditions of Service
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Last Updated: August 2026 · Governing peer-to-peer campus rentals across NIET (Plot 19, Plot 15, Plot 14).
          </p>
        </div>
      </div>

      {/* ⚠️ HIGH PRIORITY HIGHLIGHT: College Security Deposit Clause */}
      <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-red-900/20 relative overflow-hidden space-y-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl shrink-0">
            <Landmark className="h-7 w-7 text-white" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-white text-red-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full font-display">
                Mandatory Institutional Policy
              </span>
              <span className="text-xs font-bold text-red-100 uppercase tracking-wider">
                Section 4: Item Return & Security Recovery
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white">
              Unreturned Items & College Security Deposit Deduction Clause
            </h2>
            <p className="text-xs sm:text-sm text-red-50 leading-relaxed font-medium">
              By using Rentora, all student borrowers explicitly acknowledge and agree that <strong>if you fail to return a rented item at the end of the rental agreement, or return it in an irreparably damaged condition without reimbursing the owner</strong>:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-1.5">
            <div className="flex items-center gap-2 text-white font-bold text-xs font-display">
              <span className="h-2 w-2 rounded-full bg-amber-300 animate-pulse shrink-0"></span>
              <span>1. Direct College Caution Money Deduction</span>
            </div>
            <p className="text-xs text-red-100/90 leading-normal">
              The full replacement valuation of the item plus any accrued rental dues will be <strong>recovered and deducted directly from the student's institutional security money / caution deposit</strong> held with the <strong>NIET College Administration / Accounts Department</strong>.
            </p>
          </div>

          <div className="bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-1.5">
            <div className="flex items-center gap-2 text-white font-bold text-xs font-display">
              <span className="h-2 w-2 rounded-full bg-rose-300 animate-pulse shrink-0"></span>
              <span>2. Academic & Proctorial Board Disciplinary Action</span>
            </div>
            <p className="text-xs text-red-100/90 leading-normal">
              The defaulting student will be referred to the <strong>NIET Proctorial Board</strong>. Institutional clearances (no-dues certificate, semester admit cards, library/hostel clearance, and transcript issuance) will be <strong>blocked</strong> until full restitution is certified.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Terms */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-10 border border-slate-100 dark:border-slate-800 shadow-sm space-y-10 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">

        {/* Section 1 */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200 font-black text-sm">
              1
            </div>
            <h2 className="text-lg font-black font-display text-slate-900 dark:text-white">
              Student Eligibility & Campus Restriction
            </h2>
          </div>
          <p>
            Rentora is accessible strictly to students currently enrolled at <strong>Noida Institute of Engineering and Technology (NIET)</strong>. To register and participate in exchanges:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <li>You must hold an active, verified institutional email address ending with <code>@niet.co.in</code>.</li>
            <li>You must provide accurate academic credentials (course, branch, year of study, and campus plot).</li>
            <li>Accounts cannot be shared, transferred, or created on behalf of non-NIET individuals.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200 font-black text-sm">
              2
            </div>
            <h2 className="text-lg font-black font-display text-slate-900 dark:text-white">
              Listing Guidelines & Owner Responsibilities
            </h2>
          </div>
          <p>
            Lenders (Item Owners) are solely responsible for the authenticity and condition of items posted to the catalog:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <li><strong>Permitted Items:</strong> Academic textbooks, scientific/graphics calculators, engineering drawing kits, lab coats & gear, authorized electronics (monitors, cables, boards), and general student lifestyle utility items.</li>
            <li><strong>Prohibited Items:</strong> Unauthorized examination materials, contraband, weapons, hazardous chemical substances, pirated proprietary software, and any items violating NIET campus code of conduct.</li>
            <li><strong>Condition Disclosure:</strong> Lenders must accurately classify item condition (<code>New</code>, <code>Like New</code>, <code>Good</code>, <code>Fair</code>) and disclose any pre-existing defects or missing components.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200 font-black text-sm">
              3
            </div>
            <h2 className="text-lg font-black font-display text-slate-900 dark:text-white">
              Handover Protocol & Verification OTP
            </h2>
          </div>
          <p>
            To eliminate handover disputes and ensure physical security on campus:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
              <p className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <Handshake className="h-4 w-4 text-emerald-500" />
                <span>1. Campus Landmark Meetup</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All item inspections and handovers must occur within campus premises (e.g. Plot 19 Canteen, Library corridor, Plot 15/14 lawns).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
              <p className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                <span>2. In-Person Inspection</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Borrowers must test and visually inspect the item prior to sharing the Handover OTP with the lender.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
              <p className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <KeyRound className="h-4 w-4 text-amber-500" />
                <span>3. 4-Digit Handover OTP</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                The rental status is officially activated ONLY when the owner enters the borrower's 4-digit Handover OTP in the app.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200 font-black text-sm">
              4
            </div>
            <h2 className="text-lg font-black font-display text-slate-900 dark:text-white">
              Borrower Obligations & Timely Return Policy
            </h2>
          </div>
          <p>
            Borrowers must exercise reasonable care when handling rented property. Specifically:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <li><strong>Return Deadline:</strong> Items must be returned to the lender on or before the agreed <code>End Date</code>. Extension requests must be communicated and accepted in writing via in-app chat.</li>
            <li><strong>Damage & Loss:</strong> Borrowers are financially responsible for any physical damage, liquid spills, component loss, or functional defects incurred during their rental tenure.</li>
            <li><strong>Non-Return Recourse:</strong> As stated in the primary policy notice above, unreturned items will immediately trigger recovery procedures through the <strong>NIET College Caution Deposit & Proctorial Board</strong>.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200 font-black text-sm">
              5
            </div>
            <h2 className="text-lg font-black font-display text-slate-900 dark:text-white">
              Payment & Security Money Mechanism
            </h2>
          </div>
          <p>
            Rentora facilitates discovery, communication, and digital agreement records. 
            All financial transactions (rental charges & security deposits) are settled in person via Cash or UPI during physical handovers. 
            Upon successful return and mutual agreement, the security deposit must be refunded immediately to the borrower.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200 font-black text-sm">
              6
            </div>
            <h2 className="text-lg font-black font-display text-slate-900 dark:text-white">
              Account Suspension & Platform Termination
            </h2>
          </div>
          <p>
            The Rentora administrative team reserves the right to suspend, terminate, or permanently block any account found violating platform terms, posting fraudulent items, harassing fellow students, or defaulting on rental commitments.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-black font-display text-slate-900 dark:text-white">
            Dispute Escalation & Inquiries
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            For dispute mediation, unreturned item claims, or platform assistance, please report the listing directly in-app or email the Rentora student administration at{' '}
            <a href="mailto:rentora2611@gmail.com" className="text-primary-600 dark:text-primary-400 font-bold underline">
              rentora2611@gmail.com
            </a>.
          </p>
        </section>

      </div>
    </div>
  );
};

export default TermsAndConditions;
