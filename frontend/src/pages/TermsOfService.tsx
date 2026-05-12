import { Link } from 'react-router'
import { PageHero } from '../components/page/PageHero'
import { LEGAL_ENTITY_NAME, LEGAL_JURISDICTION } from '../content/legalEntity'

const section = 'space-y-4 text-sm leading-relaxed text-neutral-300 [&_h2]:font-display [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-normal [&_h2]:text-white [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-white [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_strong]:text-white [&_a]:text-[#FFD54A] [&_a]:underline-offset-2 hover:[&_a]:underline'

export default function TermsOfService() {
  return (
    <main className="bg-[#0B1020]">
      <PageHero
        eyebrow="Legal"
        title="Terms of Service"
        description={
          <>
            <strong>{LEGAL_ENTITY_NAME}</strong>
          </>
        }
      />

      <article className={`mx-auto max-w-3xl px-4 py-10 pb-20 sm:px-6 sm:py-14 ${section}`}>
        <p className="text-neutral-400 not-prose">
          <strong className="text-white">Effective Date:</strong> May 9, 2026
        </p>

        <p>
          Welcome to Rising Star Fish Gaming! These Terms of Service (&quot;Terms&quot;) govern your access
          to and use of the Rising Star Fish Gaming website, applications, and services (collectively, the
          &quot;Platform&quot;), operated by <strong>{LEGAL_ENTITY_NAME}</strong> from{' '}
          <strong>{LEGAL_JURISDICTION}</strong>. Please read these Terms carefully before using our Platform.
          By accessing or using the Platform, you agree to be bound by these Terms and our{' '}
          <Link to="/privacy" className="font-semibold text-[#FFD54A] underline-offset-2 hover:underline">
            Privacy Policy
          </Link>
          . If you do not agree to these Terms, you may not access or use the Platform.
        </p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By creating an account, making a purchase, or otherwise using the Platform, you acknowledge that you
          have read, understood, and agree to be bound by these Terms, as well as any additional terms and
          conditions that are referenced herein or that may apply to specific features of the Platform. We
          reserve the right to modify these Terms at any time, and such modifications will be effective
          immediately upon posting the revised Terms on the Platform. Your continued use of the Platform after
          any such changes constitutes your acceptance of the new Terms.
        </p>

        <h2>2. Eligibility and Account Registration</h2>
        <h3>a. Age Restriction</h3>
        <p>
          You must be at least 18 years of age or the legal age of majority in your jurisdiction, whichever is
          greater, to create an account and use the Platform. We do not permit individuals under this age to
          register or use our services. We reserve the right to request proof of age and to suspend or
          terminate accounts if we suspect a user is underage.
        </p>
        <h3>b. Account Information</h3>
        <p>
          When you register for an account, you agree to provide accurate, current, and complete information as
          prompted by the registration form. You are responsible for maintaining the confidentiality of your
          account login credentials and for all activities that occur under your account. You agree to notify
          us immediately of any unauthorized use of your account or any other breach of security.
        </p>
        <h3>c. Account Security</h3>
        <p>
          You are solely responsible for all activities that occur under your account, whether or not you
          authorized such activities. We will not be liable for any loss or damage arising from your failure to
          maintain the confidentiality of your account information.
        </p>

        <h2>3. Virtual Currency and Virtual Items</h2>
        <h3>a. Nature of Virtual Currency and Items</h3>
        <p>
          The Platform may offer virtual currency (e.g., coins, tokens) and virtual items (e.g., in-game
          power-ups, cosmetic enhancements) for purchase or through gameplay. These virtual currencies and
          items have no real-world monetary value and cannot be redeemed for real money, goods, or services
          outside the Platform. They are merely a limited, revocable license to use certain features within the
          Platform.
        </p>
        <h3>b. No Ownership Interest</h3>
        <p>
          You acknowledge that you do not own the virtual currency or virtual items you acquire. Instead, you
          are granted a limited, personal, non-transferable, non-sublicensable, revocable license to use them
          solely within the Platform for your personal, non-commercial entertainment. Any virtual currency or
          items are subject to our sole discretion and may be modified, removed, or terminated at any time
          without notice or compensation.
        </p>
        <h3>c. Purchases and Refunds</h3>
        <p>
          All purchases of virtual currency and virtual items are final and non-refundable, unless otherwise
          required by applicable law or explicitly stated in our refund policy. We reserve the right to manage,
          regulate, control, modify, or eliminate virtual currency and virtual items as we see fit, and we shall
          have no liability to you or anyone for the exercise of such rights.
        </p>

        <h2>4. User Conduct and Prohibited Activities</h2>
        <p>
          You agree to use the Platform only for lawful purposes and in a manner that does not infringe the
          rights of, restrict, or inhibit anyone else&apos;s use and enjoyment of the Platform. Prohibited
          activities include, without limitation: cheating or exploitation; harassment or abuse; fraudulent
          activity; intellectual property infringement; malicious software; unauthorized access; and commercial
          use without our express written consent.
        </p>
        <p>
          We reserve the right to investigate and take appropriate legal action against anyone who, in our sole
          discretion, violates this provision, including without limitation terminating your account and
          reporting you to law enforcement authorities.
        </p>

        <h2>5. Intellectual Property</h2>
        <p>
          All content on the Platform, including but not limited to text, graphics, logos, images, audio clips,
          video clips, data compilations, and software, is the property of <strong>{LEGAL_ENTITY_NAME}</strong>{' '}
          (operating as Rising Star Fish Gaming) or its content suppliers and is protected by international
          copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights
          laws. You may not reproduce, distribute, modify, create derivative works of, publicly display,
          publicly perform, republish, download, store, or transmit any of the material on our Platform without
          our prior written consent.
        </p>

        <h2>6. Disclaimers and Limitation of Liability</h2>
        <h3>a. Disclaimer of Warranties</h3>
        <p className="uppercase tracking-wide text-neutral-400">
          THE PLATFORM IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS, WITHOUT ANY
          WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMISSIBLE PURSUANT TO
          APPLICABLE LAW, {LEGAL_ENTITY_NAME} AND RISING STAR FISH GAMING DISCLAIM ALL WARRANTIES, EXPRESS OR
          IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE, NON-INFRINGEMENT, AND TITLE. WE DO NOT WARRANT THAT THE PLATFORM WILL BE
          UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
        </p>
        <h3>b. Limitation of Liability</h3>
        <p className="uppercase tracking-wide text-neutral-400">
          TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL {LEGAL_ENTITY_NAME}, RISING STAR
          FISH GAMING, ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, SUPPLIERS, OR LICENSORS BE LIABLE
          FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION,
          LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM (I) YOUR ACCESS TO OR
          USE OF OR INABILITY TO ACCESS OR USE THE PLATFORM; (II) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE
          PLATFORM; (III) ANY CONTENT OBTAINED FROM THE PLATFORM; AND (IV) UNAUTHORIZED ACCESS, USE, OR
          ALTERATION OF YOUR TRANSMISSIONS OR CONTENT, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING
          NEGLIGENCE), OR ANY OTHER LEGAL THEORY, WHETHER OR NOT WE HAVE BEEN INFORMED OF THE POSSIBILITY OF
          SUCH DAMAGE, AND EVEN IF A REMEDY SET FORTH HEREIN IS FOUND TO HAVE FAILED OF ITS ESSENTIAL PURPOSE.
        </p>

        <h2>7. Indemnification</h2>
        <p>
          You agree to defend, indemnify, and hold harmless <strong>{LEGAL_ENTITY_NAME}</strong>, Rising Star
          Fish Gaming, its affiliates, licensors, and service providers, and its and their respective officers,
          directors, employees, contractors, agents, licensors, suppliers, successors, and assigns from and
          against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including
          reasonable attorneys&apos; fees) arising out of or relating to your violation of these Terms or your
          use of the Platform.
        </p>

        <h2>8. Governing Law and Dispute Resolution</h2>
        <p>
          These Terms shall be governed and construed in accordance with the laws of{' '}
          <strong>{LEGAL_JURISDICTION}</strong>, without regard to its conflict of law provisions. Any dispute
          arising from or relating to the subject matter of these Terms shall be finally settled by arbitration
          in <strong>{LEGAL_JURISDICTION}</strong>, in accordance with the Commercial Arbitration Rules of the
          American Arbitration Association or an equivalent arbitration body recognized in {LEGAL_JURISDICTION},
          excluding any rules or procedures governing class actions. You agree that any dispute resolution
          proceedings will be conducted only on an individual basis and not in a class, consolidated, or
          representative action.
        </p>

        <h2>9. Changes to the Terms</h2>
        <p>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a
          revision is material, we will provide at least 30 days&apos; notice prior to any new terms taking
          effect. What constitutes a material change will be determined at our sole discretion. By continuing to
          access or use our Platform after those revisions become effective, you agree to be bound by the
          revised terms. If you do not agree to the new terms, please stop using the Platform.
        </p>

        <h2>10. Contact Information</h2>
        <p>If you have any questions about these Terms, please contact us:</p>
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
            <Link to="/support" className="font-semibold text-[#FFD54A] underline-offset-2 hover:underline">
              Contact us through Support
            </Link>
          </li>
        </ul>

        <h2>References</h2>
        <ol className="text-sm text-neutral-400">
          <li>
            TermsFeed. (n.d.). <em>Terms &amp; Conditions for Games</em>.{' '}
            <a
              href="https://www.termsfeed.com/blog/terms-conditions-games/"
              target="_blank"
              rel="noopener noreferrer"
              className="break-all"
            >
              termsfeed.com
            </a>
          </li>
        </ol>
      </article>
    </main>
  )
}
