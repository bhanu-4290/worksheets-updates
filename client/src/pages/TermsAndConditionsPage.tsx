import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft } from "lucide-react";

export const TermsAndConditionsPage: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Terms & Conditions | SYNC SPACE by MATRIX";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Terms and Conditions governing access to and use of the SYNC SPACE internal enterprise work management platform by MATRIX."
      );
    }
  }, []);

  const body = (
    <article className="max-w-[720px] w-full mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-10 text-slate-800 dark:text-slate-200">
      <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Terms &amp; Conditions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Last updated: October 13, 2026
          </p>
        </div>
        <Link
          to={user ? "/dashboard" : "/login"}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 self-start sm:self-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {user ? "Back to Dashboard" : "Back to Sign In"}
        </Link>
      </div>

      <div className="space-y-6 text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or signing in to the SYNC SPACE platform operated by <strong>MATRIX</strong>, you agree to comply with and be bound by these Terms &amp; Conditions and all applicable company workplace policies. If you do not agree to these terms, you must not access or use the platform.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            2. Authorized Use of the Platform
          </h2>
          <p>
            SYNC SPACE is an internal operational system provided to active employees, managers, team leads, and administrators for recording daily work updates, managing assigned tasks, reviewing team submissions, and conducting internal workplace communication. Access is restricted to individuals who have been issued an authorized account by a Super Admin.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            3. User Conduct and Account Responsibility
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>You are responsible for maintaining the confidentiality of your account password and session credentials.</li>
            <li>All daily work entries, hours spent, task status updates, and comments submitted under your account must be accurate and truthful.</li>
            <li>You must not attempt to bypass role-based access restrictions, access records belonging to unauthorized departments, or interfere with platform security or audit logging.</li>
            <li>Internal direct chat and announcement channels must be used strictly for professional workplace communication.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            4. Intellectual Property
          </h2>
          <p>
            All software code, database schemas, user interface designs, project records, work reports, and documentation within SYNC SPACE are the exclusive property of MATRIX or its licensors. Users are granted a limited, revocable, non-transferable license to use the platform solely in connection with their employment duties.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            5. Internal Platform Scope (No Consumer Billing)
          </h2>
          <p>
            SYNC SPACE is an internal enterprise management tool provided by MATRIX to its personnel. No consumer purchases, public subscriptions, or payment processing occur on this website.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            6. Disclaimers
          </h2>
          <p>
            The SYNC SPACE platform is provided on an "as is" and "as available" basis for internal operational use. While MATRIX maintains scheduled backups and security controls, we do not warrant uninterrupted availability or error-free operation at all times.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            7. Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by applicable law, MATRIX and its administrators shall not be liable for any indirect, incidental, or consequential damages arising out of temporary platform downtime, network interruptions, or unauthorized use of employee credentials.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            8. Third-Party Links and References
          </h2>
          <p>
            Task descriptions, comments, or announcements may occasionally reference external project links or third-party documentation tools. The organization is not responsible for the content or availability of external websites outside the SYNC SPACE domain.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            9. Account Suspension and Termination
          </h2>
          <p>
            System administrators reserve the right to deactivate or suspend any user account immediately upon termination of employment, role reassignment, or suspected violation of these Terms &amp; Conditions or company security policies.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            10. Governing Law and Jurisdiction
          </h2>
          <p>
            These Terms &amp; Conditions are governed by and construed in accordance with the laws of India. Any disputes arising in connection with the use of this platform shall be subject to the exclusive jurisdiction of the competent courts in India.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            11. Changes to These Terms
          </h2>
          <p>
            We may revise these Terms &amp; Conditions from time to time. Continued use of the SYNC SPACE platform after changes are published constitutes acceptance of the revised terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            12. Contact Details
          </h2>
          <p>
            For questions regarding these Terms &amp; Conditions or platform access, contact:
          </p>
          <div className="p-4 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
            <div><strong>Organization:</strong> MATRIX</div>
            <div><strong>Support Email:</strong> <a href="mailto:gbhanu2811@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">gbhanu2811@gmail.com</a></div>
            <div><strong>Contact Number:</strong> <a href="tel:7337504290" className="text-blue-600 dark:text-blue-400 hover:underline">7337504290</a></div>
            <div><strong>Jurisdiction:</strong> India</div>
          </div>
        </section>
      </div>
    </article>
  );

  if (user) {
    return <div className="py-2">{body}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between py-10 px-4 sm:px-6">
      {body}
      <footer className="max-w-[720px] w-full mx-auto mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <span>MATRIX - SYNC SPACE Platform</span>
        <div className="flex items-center gap-4">
          <Link to="/login" className="hover:text-blue-600 hover:underline">
            Sign In
          </Link>
          <Link to="/how-to-use" className="hover:text-blue-600 hover:underline">
            How to Use
          </Link>
          <Link to="/privacy-policy" className="hover:text-blue-600 hover:underline">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
};
