import { Link } from 'react-router'
import { PageHero } from '../components/page/PageHero'
import { LEGAL_ENTITY_NAME, LEGAL_JURISDICTION } from '../content/legalEntity'

const section = 'space-y-4 text-sm leading-relaxed text-neutral-300 [&_h2]:font-display [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-normal [&_h2]:text-white [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-white [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_strong]:text-white [&_a]:text-[#FFD700] [&_a]:underline-offset-2 hover:[&_a]:underline'

export default function PrivacyPolicy() {
  return (
    <main className="bg-[#0a0a0b]">
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        description={
          <>
            Operated by <strong className="text-white">{LEGAL_ENTITY_NAME}</strong>.
          </>
        }
      />

      <article className={`mx-auto max-w-3xl px-4 py-10 pb-20 sm:px-6 sm:py-14 ${section}`}>
        <p className="text-neutral-400 not-prose">
          <strong className="text-white">Effective Date:</strong> May 9, 2026
        </p>

        <p>
          Rising Star Fish Gaming (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is the brand through
          which <strong>{LEGAL_ENTITY_NAME}</strong> operates. We are committed to protecting the privacy of
          our users (&quot;you&quot; or &quot;your&quot;) who access and use our online gaming and social
          casino platform (the &quot;Platform&quot;). This Privacy Policy outlines how we collect, use,
          disclose, and safeguard your information when you visit our website, use our applications, or
          engage with our services. By accessing or using our Platform, you agree to the terms of this
          Privacy Policy.
        </p>

        <h2>1. Information We Collect</h2>
        <p>We collect various types of information to provide and improve our services, including:</p>

        <h3>a. Personal Information</h3>
        <p>This includes information that can be used to identify you directly or indirectly:</p>
        <ul>
          <li>
            <strong>Contact Information:</strong> Name, email address, postal address, and phone number.
          </li>
          <li>
            <strong>Account Information:</strong> Username, password, and unique identifiers.
          </li>
          <li>
            <strong>Demographic Information:</strong> Date of birth (for age verification), gender, and
            country of residence.
          </li>
          <li>
            <strong>Financial Information:</strong> Payment method details (e.g., credit card numbers, bank
            account information) for transactions, though this is typically processed by third-party payment
            providers and not stored directly by us in its entirety.
          </li>
          <li>
            <strong>Identity Verification Information:</strong> Copies of identification documents (e.g.,
            driver&apos;s license, passport) as required by regulatory obligations for age and identity
            verification.
          </li>
        </ul>

        <h3>b. Non-Personal Information</h3>
        <p>This includes information that does not directly identify you:</p>
        <ul>
          <li>
            <strong>Usage Data:</strong> Information about how you interact with our Platform, such as game
            play history, features used, time spent, and preferences.
          </li>
          <li>
            <strong>Technical Data:</strong> IP address, browser type, operating system, device identifiers,
            and internet service provider.
          </li>
          <li>
            <strong>Cookies and Tracking Technologies:</strong> Data collected through cookies, web beacons,
            and similar technologies to enhance user experience, analyze trends, and administer the Platform.
          </li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use the collected information for various purposes, including:</p>
        <ul>
          <li>
            <strong>To Provide and Maintain the Platform:</strong> Operating, maintaining, and improving our
            gaming services, including game functionality, customer support, and account management.
          </li>
          <li>
            <strong>Age and Identity Verification:</strong> Ensuring compliance with legal age restrictions
            and preventing fraudulent activities.
          </li>
          <li>
            <strong>Process Transactions:</strong> Facilitating deposits, withdrawals, and other financial
            transactions on the Platform.
          </li>
          <li>
            <strong>Personalization:</strong> Customizing your gaming experience, offering tailored content,
            and providing personalized recommendations.
          </li>
          <li>
            <strong>Communication:</strong> Sending you service-related announcements, updates, security
            alerts, and promotional offers (with your consent where required).
          </li>
          <li>
            <strong>Analytics and Research:</strong> Analyzing usage patterns, conducting research, and
            performing statistical analysis to understand and improve our services.
          </li>
          <li>
            <strong>Security and Fraud Prevention:</strong> Detecting, preventing, and addressing fraud,
            security incidents, and other malicious activities.
          </li>
          <li>
            <strong>Legal Compliance:</strong> Fulfilling our legal and regulatory obligations, including
            anti-money laundering (AML) and responsible gaming requirements.
          </li>
        </ul>

        <h2>3. How We Share Your Information</h2>
        <p>We may share your information with third parties in the following circumstances:</p>
        <ul>
          <li>
            <strong>Service Providers:</strong> We engage trusted third-party service providers to perform
            functions on our behalf, such as payment processing, data analysis, hosting, customer support, and
            marketing. These providers are obligated to protect your information and use it only for the
            purposes for which it was disclosed.
          </li>
          <li>
            <strong>Legal and Regulatory Authorities:</strong> We may disclose your information if required
            by law, regulation, legal process, or governmental request, or to protect our rights, property, or
            safety, and the rights, property, or safety of our users or others.
          </li>
          <li>
            <strong>Business Transfers:</strong> In the event of a merger, acquisition, reorganization,
            bankruptcy, or sale of all or a portion of our assets, your information may be transferred as part
            of that transaction.
          </li>
          <li>
            <strong>Affiliates:</strong> We may share information with our affiliated companies for business
            and operational purposes.
          </li>
          <li>
            <strong>With Your Consent:</strong> We may share your information with third parties when we
            have your explicit consent to do so.
          </li>
        </ul>

        <h2>4. Data Security</h2>
        <p>
          We implement robust technical and organizational measures to protect your information from
          unauthorized access, disclosure, alteration, and destruction. These measures include encryption
          (e.g., SSL/TLS), access controls, regular security reviews, and partnering with reputable payment
          gateways. No method of transmission over the internet or electronic storage is 100% secure. While we
          strive to use commercially acceptable means to protect your personal information, we cannot
          guarantee its absolute security.
        </p>

        <h2>5. Data Retention</h2>
        <p>
          We retain your personal information for as long as necessary to fulfill the purposes outlined in this
          Privacy Policy, unless a longer retention period is required or permitted by law. This includes
          retaining information to comply with legal obligations, resolve disputes, and enforce our
          agreements.
        </p>

        <h2>6. Your Privacy Rights</h2>
        <p>Depending on your jurisdiction, you may have the following rights regarding your personal information:</p>
        <ul>
          <li>Right to Access, Rectification, Erasure, Restriction of Processing, Data Portability, Object, and Withdraw Consent where applicable.</li>
        </ul>
        <p>
          To exercise any of these rights, please contact us using the information in the &quot;Contact Us&quot;
          section below. We may require you to verify your identity before fulfilling your request.
        </p>

        <h2>7. Children&apos;s Privacy</h2>
        <p>
          Our Platform is not intended for individuals under the legal gambling age in their respective
          jurisdictions. We do not knowingly collect personal information from children. If we become aware
          that we have inadvertently collected personal information from a child, we will take steps to delete
          such information as quickly as possible.
        </p>

        <h2>8. Changes to This Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices or legal
          requirements. We will notify you of any material changes by posting the updated Privacy Policy on our
          Platform and updating the &quot;Effective Date&quot; at the top of this document. We encourage you to
          review this Privacy Policy periodically.
        </p>

        <h2>9. Contact Us</h2>
        <p>If you have any questions or concerns about this Privacy Policy or our data practices, please contact us:</p>
        <ul className="not-prose list-none pl-0 text-neutral-300">
          <li>
            <strong className="text-white">Legal entity:</strong> {LEGAL_ENTITY_NAME}
          </li>
          <li>
            <strong className="text-white">Location:</strong> {LEGAL_JURISDICTION}
          </li>
          <li>
            <strong className="text-white">Brand:</strong> Rising Star Fish Gaming
          </li>
          <li className="mt-2">
            <Link to="/support" className="font-semibold text-[#FFD700] underline-offset-2 hover:underline">
              Contact us through Support
            </Link>
          </li>
        </ul>

        <h2>References</h2>
        <ol className="text-sm text-neutral-400">
          <li>
            The London Economic. (2025, February 4).{' '}
            <em>Data Privacy Regulations: Ensuring Security in Online Casinos</em>.{' '}
            <a
              href="https://www.thelondoneconomic.com/tech-auto/technology/data-privacy-regulations-ensuring-security-in-online-casinos-389453/"
              target="_blank"
              rel="noopener noreferrer"
              className="break-all"
            >
              thelondoneconomic.com
            </a>
          </li>
          <li>
            IT Security Guru. (2025, June 10).{' '}
            <em>High Stakes Privacy: A Guide to Data Security in Gambling</em>.{' '}
            <a
              href="https://www.itsecurityguru.org/2025/06/10/high-stakes-privacy-a-guide-to-data-security-in-gambling/"
              target="_blank"
              rel="noopener noreferrer"
              className="break-all"
            >
              itsecurityguru.org
            </a>
          </li>
        </ol>
      </article>
    </main>
  )
}
