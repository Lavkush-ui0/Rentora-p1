import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, Database, UserCheck, ArrowLeft } from 'lucide-react';
import { SEO } from '../components/common/SEO';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-300">
      <SEO 
        title="Privacy Policy"
        description="Learn how Rentora protects student data, credentials, and rental activities with zero commercial third-party data sharing across NIET campus."
        canonical="https://rentora.org.in/privacy"
      />
      {/* Top Breadcrumb / Back button */}
      <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 dark:text-slate-400">
        <Link to="/" className="hover:text-[#9E1B1B] dark:hover:text-red-400 flex items-center gap-1 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </Link>
        <span>/</span>
        <span className="text-slate-800 dark:text-slate-200">Privacy Policy</span>
      </div>

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-bold font-display">
            <Shield className="h-4 w-4" />
            <span>NIET Campus Data Protection</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display text-slate-900 dark:text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Effective Date: August 2026 · Rentora (NIET Student Edition)
          </p>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-10 border border-slate-100 dark:border-slate-800 shadow-sm space-y-10 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
        
        {/* Section 1 */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center text-primary-600 dark:text-primary-400 font-black text-sm">
              1
            </div>
            <h2 className="text-lg font-black font-display text-slate-900 dark:text-white">
              Campus Scope & Commitment
            </h2>
          </div>
          <p>
            Rentora is a specialized, closed-loop student peer-to-peer rental marketplace operating exclusively for students of <strong>Noida Institute of Engineering and Technology (NIET)</strong> across Plot 19, Plot 15, and Plot 14 campuses. We take the privacy and confidentiality of student data very seriously and design our platform strictly around campus safety and academic integrity.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center text-primary-600 dark:text-primary-400 font-black text-sm">
              2
            </div>
            <h2 className="text-lg font-black font-display text-slate-900 dark:text-white">
              Information We Collect
            </h2>
          </div>
          <p>To enable safe peer-to-peer borrowing and verification within the college network, we collect:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                <UserCheck className="h-4 w-4 text-emerald-500" />
                <span>Academic Identity</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Full name, official college email address (<code>@niet.co.in</code>), academic course, branch, specialization, year of study, and campus plot.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                <Database className="h-4 w-4 text-blue-500" />
                <span>Listings & Exchange Data</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Uploaded item images, descriptions, rental pricing, security deposit terms, item condition ratings, and rental booking history.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                <Lock className="h-4 w-4 text-amber-500" />
                <span>Authentication & OTP Codes</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cryptographically hashed passwords (<code>bcrypt</code>), single-use registration/login OTPs (which auto-expire in 10 minutes), and 4-digit physical handover verification OTPs.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                <Eye className="h-4 w-4 text-purple-500" />
                <span>In-App Messages & Reviews</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chat logs exchanged between lenders and borrowers to arrange meetup points, along with post-rental ratings and reviews.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center text-primary-600 dark:text-primary-400 font-black text-sm">
              3
            </div>
            <h2 className="text-lg font-black font-display text-slate-900 dark:text-white">
              How We Use Your Data
            </h2>
          </div>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <li><strong>Verifying Student Authenticity:</strong> Validating that accounts belong to registered NIET students through domain checks and email OTP verification.</li>
            <li><strong>Facilitating Campus Exchanges:</strong> Permitting students to discover available academic items and arrange physical meetups at designated campus spots.</li>
            <li><strong>Safety & Trust:</strong> Preventing fraud via 4-digit Handover OTPs and transparent student reputation scoring.</li>
            <li><strong>Dispute Resolution & Policy Enforcement:</strong> Resolving unreturned or damaged item claims with college records when necessary under the Institutional Security Deposit Recovery Clause.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center text-primary-600 dark:text-primary-400 font-black text-sm">
              4
            </div>
            <h2 className="text-lg font-black font-display text-slate-900 dark:text-white">
              No Third-Party Commercial Data Sales
            </h2>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30">
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 leading-relaxed">
              Rentora does <strong>not</strong> sell, lease, or monetize personal student information with external advertisers or commercial data brokers. Your information remains strictly within the platform and the NIET institutional ecosystem.
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center text-primary-600 dark:text-primary-400 font-black text-sm">
              5
            </div>
            <h2 className="text-lg font-black font-display text-slate-900 dark:text-white">
              Data Security & Storage
            </h2>
          </div>
          <p>
            All network communication with Rentora is secured over encrypted Transport Layer Security (TLS/HTTPS). User passwords are encrypted using multi-round salted bcrypt hashes. Single-use OTPs are automatically purged from the database via MongoDB TTL indexes.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center text-primary-600 dark:text-primary-400 font-black text-sm">
              6
            </div>
            <h2 className="text-lg font-black font-display text-slate-900 dark:text-white">
              Account Deletion & Data Rights
            </h2>
          </div>
          <p>
            You have full control over your profile data. You may update your academic information or permanently delete your account and listings at any time through the{' '}
            <Link to="/settings" className="text-[#9E1B1B] dark:text-red-400 font-bold underline hover:opacity-80">
              Settings &gt; Danger Zone
            </Link>{' '}
            page.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-black font-display text-slate-900 dark:text-white">
            Contact & Grievances
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            For questions regarding privacy, reporting fraudulent accounts, or data requests, contact the Rentora student team or administration at{' '}
            <a href="mailto:support@rentora.org.in" className="text-primary-600 dark:text-primary-400 font-bold underline">
              support@rentora.org.in
            </a>.
          </p>
        </section>

      </div>
    </div>
  );
};

export default PrivacyPolicy;
