import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft } from "lucide-react";

export const PrivacyPolicyPage: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Privacy Policy | SYNC SPACE by MATRIX";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Privacy Policy for SYNC SPACE by MATRIX covering employee data collection, usage, security, retention, and rights under applicable Indian law."
      );
    }
  }, []);

  const body = (
    <article className="max-w-[720px] w-full mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-10 text-slate-800 dark:text-slate-200">
      <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Privacy Policy
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
            1. Introduction
          </h2>
          <p>
            This Privacy Policy describes how <strong>MATRIX</strong>, operating the SYNC SPACE internal operations and task reporting platform, collects, uses, stores, and protects personal data of its employees, contractors, and authorized administrative users.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            2. Information We Collect
          </h2>
          <p>
            We collect only the information necessary to operate internal work reporting, task assignment, and organizational administration:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Account and Profile Data:</strong> Full name, employee ID, work email address, job title, role level (Super Admin, Manager, Team Lead, Executive), department, team assignment, joining date, and optional date of birth (used for internal birthday announcements).
            </li>
            <li>
              <strong>Work and Operational Records:</strong> Daily work report entries, task assignments, task status updates, comments, blocker escalations, and direct chat messages sent within the platform.
            </li>
            <li>
              <strong>Authentication and Security Logs:</strong> Encrypted password hashes, session tokens, login timestamps, IP addresses, and administrative audit trail records.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            3. How We Use Information
          </h2>
          <p>The information collected on SYNC SPACE is used strictly for internal business operations:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Authenticating users and enforcing role-based access permissions across departments and teams.</li>
            <li>Assigning, delegating, and tracking project tasks between Managers, Team Leads, and Executives.</li>
            <li>Recording and reviewing daily work reports and calculating derived project hours.</li>
            <li>Facilitating internal communication through direct messaging, announcements, and automated birthday wishes.</li>
            <li>Maintaining security audit logs and preventing unauthorized access.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            4. Local Storage and Session Tokens
          </h2>
          <p>
            SYNC SPACE uses browser local storage strictly to store your authentication token (JWT), active user profile cache, and interface theme preference (light or dark mode). We do not use third-party advertising trackers or cross-site marketing cookies.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            5. Third-Party Services and Data Sharing
          </h2>
          <p>
            We do not sell, rent, or trade employee personal data to third parties. Data is hosted on MATRIX's dedicated database and application infrastructure. Access is restricted to authorized personnel within your reporting hierarchy and system administrators. Data may be disclosed only when required to comply with applicable law or lawful requests by public authorities.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            6. Data Retention
          </h2>
          <p>
            Employee profiles, work reports, task histories, and audit logs are retained for the duration of your active employment or engagement with MATRIX, and thereafter for the period required by internal compliance policies and applicable Indian labor, tax, and corporate laws.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            7. Your Rights Under Applicable Law
          </h2>
          <p>
            In accordance with India's Digital Personal Data Protection Act, 2023 (DPDP Act) and the Information Technology Act, 2000, authorized users have the right to:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Request access to a summary of their personal data stored in SYNC SPACE.</li>
            <li>Request correction or updating of inaccurate or incomplete profile details through their Super Admin or HR administrator.</li>
            <li>Request erasure or deactivation of personal data subject to statutory employment record retention obligations.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            8. Data Security
          </h2>
          <p>
            We implement technical and organizational safeguards including bcrypt password hashing, JSON Web Token (JWT) session verification, role-based access control middleware, and administrative audit logging. However, no electronic transmission or storage system is completely immune to risk, and users must keep their login credentials confidential.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            9. Children's Privacy
          </h2>
          <p>
            SYNC SPACE is an internal enterprise workplace platform intended exclusively for adult employees and authorized personnel. We do not knowingly collect personal information from individuals under the age of 18.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            10. Changes to This Privacy Policy
          </h2>
          <p>
            We may update this Privacy Policy periodically to reflect operational or legal changes. The updated version will be indicated by the "Last updated" date at the top of this page.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            11. Contact Information
          </h2>
          <p>
            For questions, data access requests, or privacy concerns regarding SYNC SPACE, please contact:
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
          <Link to="/terms-and-conditions" className="hover:text-blue-600 hover:underline">
            Terms &amp; Conditions
          </Link>
        </div>
      </footer>
    </div>
  );
};
