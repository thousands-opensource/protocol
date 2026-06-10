import { GetServerSideProps } from "next";

import React from "react";

const TermsOfService = () => (
    <div  style={{ fontFamily: "Merriweather, serif" }} className="terms-of-service px-8 py-12 max-w-6xl font-inter mx-auto text-gray-800 leading-relaxed">
         <style>
         <style>
    {`
      @import url("https://fonts.googleapis.com/css2?family=Merriweather:wght@400;600;700&display=swap");

      .serif-font {
        font-family: "Merriweather", serif;
      }

      .terms-of-service ul {
        margin-left: 1.0em;
    }

      .terms-of-service li {
        list-style-position: outside;
        padding-left: 1.25rem;
        text-indent: 0;
      }
    `}
  </style>
  </style>
        <h1 className="text-4xl font-bold underline mb-4">TERMS OF SERVICE</h1>
        <p className="italic mb-6">Last Revised on March 10, 2025</p>

        <p className="mb-4">
            Welcome to the Terms of Service (these <strong>“Terms”</strong>) for our website-hosted user interface located at <strong>thousands.tv</strong> (the <strong>“Interface”</strong>), in each case, operated by or on behalf of Wildcard Alliance (<strong>“Company”, “we” or “us”</strong>). The Interface and any content, tools, documentation, features and functionality offered on or through the Interface are collectively referred to as the <strong>“Services”</strong>.
        </p>

        <p className="mb-4">
            These Terms govern your access to and use of the Services. Please read these Terms carefully, as they include important information about your legal rights. By accessing and/or using the Services, you are agreeing to these Terms. If you do not understand or agree to these Terms, please do not use the Services.
        </p>

        <p className="mb-4">
            For purposes of these Terms, <strong>“you”</strong> and <strong>“your”</strong> means you as the user of the Services. If you use the Services on behalf of a company or other entity then <strong>“you”</strong> includes you and that entity, and you represent and warrant that (a) you are an authorized representative of the entity with the authority to bind the entity to these Terms, and (b) you agree to these Terms on the entity’s behalf.
        </p>

        <div className="bg-yellow-100 p-4 font-bold rounded-lg my-6">
            <strong>SECTION 10 CONTAINS AN ARBITRATION CLAUSE AND CLASS ACTION WAIVER.</strong> BY AGREEING TO THESE TERMS, YOU AGREE (A) TO RESOLVE ALL DISPUTES (WITH LIMITED EXCEPTION) RELATED TO THE COMPANY’S SERVICES AND/OR PRODUCTS THROUGH BINDING INDIVIDUAL ARBITRATION, WHICH MEANS THAT YOU WAIVE ANY RIGHT TO HAVE THOSE DISPUTES DECIDED BY A JUDGE OR JURY, AND (B) TO WAIVE YOUR RIGHT TO PARTICIPATE IN CLASS ACTIONS, CLASS ARBITRATIONS, OR REPRESENTATIVE ACTIONS, AS SET FORTH BELOW. YOU HAVE THE RIGHT TO OPT-OUT OF THE ARBITRATION CLAUSE AND THE CLASS ACTION WAIVER AS EXPLAINED IN SECTION 9.
        </div>

        <h2 className="text-2xl font-bold underline mt-8 mb-4">Table of Contents</h2>
        <ol className="list-decimal ml-6 mb-8 space-y-1">
            <li>THE SERVICES</li>
            <li>Who May Use the Services</li>
            <li>Offerings and Payment</li>
            <li>Location of Our Privacy Policy and other policies</li>
            <li>Rights We Grant You</li>
            <li>Ownership and Content</li>
            <li>Third Party Services and Materials</li>
            <li>Disclaimers, Limitations of Liability and Indemnification</li>
            <li>ARBITRATION AND CLASS ACTION WAIVER</li>
            <li>Additional Provisions</li>
        </ol>

        <div className="container mx-auto p-6">
            <h2 className="text-2xl font-bold underline mb-4">1. THE SERVICES</h2>

            <h3 className="text-xl font-semibold mt-4">1.1 General</h3>
            <p className="mb-4">
                The Services allow users and other organizations to create, stream, post, transmit,
                perform, or store content, messages, text, sound, images, applications, code, or
                other data or materials, including distribution of streaming live and pre-recorded
                audiovisual works, and to interact with content posted by other users.
            </p>

            <h3 className="text-xl font-semibold mt-4">1.2 The Protocol</h3>
            <p className="mb-4">
                The Services also display data and provide certain tools and functionality to facilitate
                a user’s access to the <strong>Thousands Protocol</strong>, a blockchain-based protocol that is designed
                to enable developers, publishers, content creators, and communities to safely and efficiently
                transact with each other, within the context of live and interactive online environments such
                as video games and streaming networks. This enables a variety of activities such as posting
                user-acquisition bounties or tipping streamers (<strong>the “Protocol”</strong>).
            </p>
            <p className="mb-4">
                Certain Services may be available for a fee payable via the Protocol. However, the Protocol
                itself is not part of the Services. Other developers may create their own interfaces to function
                with the Protocol, which we do not control. We do not take possession, custody, or control over
                any digital assets on the Protocol, except those specifically authorized to be held on behalf of
                third parties. You acknowledge and agree that we make no representations or warranties regarding
                the Protocol. Your use of the Protocol is entirely at your own risk.
            </p>

            <h3 className="text-xl font-semibold mt-4">1.3 Account</h3>
            <p className="mb-4">
                To use certain Services, you will need to create an account or link another account
                (<strong>“Account”</strong>). You agree to provide accurate, complete, and updated information
                for your Account. You are solely responsible for all activity on your Account and for
                maintaining the confidentiality and security of your password. We are not liable for
                any acts or omissions by you regarding your Account.
            </p>
            <p className="mb-4">
                You must immediately notify us at <a href="mailto:legal@wildcardalliance.com" className="text-blue-600">legal@wildcardalliance.com</a>
                {" "}
                if you suspect that your Account or password has been stolen, misappropriated, or compromised.
                You agree not to create any Account if we have previously removed or banned you from the Services,
                unless we provide written consent otherwise.
            </p>

            <h3 className="text-xl font-semibold mt-4">1.4 Wallets</h3>
            <p className="mb-4">
                To use the Services that interact with the Protocol, you must connect a compatible third-party
                digital wallet (<strong>“Wallet”</strong>). By using a Wallet in connection with the Services, you
                acknowledge that you are using it under the terms and conditions of the applicable third-party
                provider. Wallets are not associated with, maintained by, supported by, or affiliated with the Company.
            </p>
            <p className="mb-4">
                We are not a party to any transactions conducted through the Interface and do not have possession,
                custody, or control over digital assets appearing on the Services. When you interact with the Interface,
                you retain full control over your digital assets. We are not responsible or liable for your use of a
                Wallet and make no representations regarding compatibility with the Services.
            </p>
            <p className="mb-4">
                The private keys necessary to access assets in a Wallet are not held by the Company. We cannot help you
                access or recover private keys or seed phrases for your Wallet. You are solely responsible for maintaining
                the confidentiality of your private keys and for any transactions signed with them.
            </p>

            <h3 className="text-xl font-semibold mt-4">1.5 Updates; Monitoring</h3>
            <p className="mb-4">
                We may make improvements, modifications, or updates to the Services from time to time, including changes
                to underlying software, infrastructure, security protocols, technical configurations, or service features
                (<strong>“Updates”</strong>). Your continued use of the Services is subject to such Updates, and you must accept
                any patches, system upgrades, bug fixes, or feature modifications.
            </p>
            <p className="mb-4">
                We are not liable for any failure on your part to accept and implement Updates as required. While we are not
                obligated to monitor access to or participation in the Services, we reserve the right to do so to ensure
                compliance with our Terms and applicable laws.
            </p>
        </div>

        <div className="container mx-auto p-6">
            <h2 className="text-2xl font-bold underline mb-4">2. WHO MAY USE THE SERVICES</h2>

            <h3 className="text-xl font-semibold mt-4">2.1 Eligibility</h3>
            <p className="mb-4">
                You cannot use the Services if you are a <strong>Prohibited Person</strong>. A “Prohibited Person” is any person or entity that is:
            </p>
            <ul className="list-disc list-inside mb-4">
                <li>
                    <strong>(a)</strong> Listed on any U.S. Government list of prohibited or restricted parties,
                    including the U.S. Treasury Department’s list of Specially Designated Nationals or the
                    U.S. Department of Commerce Denied Person’s List or Entity List.
                </li>
                <li>
                    <strong>(b)</strong> Located or organized in any U.S.-embargoed country or any country that has been designated by the U.S. Government as “terrorist-supporting.”
                </li>
                <li>
                    <strong>(c)</strong> Owned or controlled by any persons or entities listed in (a)-(b).
                </li>
            </ul>
            <p className="mb-4">
                You acknowledge and agree that you are solely responsible for complying with all
                applicable laws of the jurisdiction you are located in or accessing the Services from
                in connection with your use of the Services. By using the Services, you represent
                and warrant that you meet these requirements and will not be using the Services for
                any illegal activity or to engage in the prohibited activities in these Terms.
            </p>

            <h3 className="text-xl font-semibold mt-4">2.2 Other Information</h3>
            <p className="mb-4">
                We may require you to provide additional information and documents regarding
                your use of the Services, including at the request of any competent authority or
                in case of application of any applicable law or regulation, including laws related
                to anti-money laundering or for counteracting financing of terrorism.
            </p>
            <p className="mb-4">
                We may also require you to provide additional information or documents in cases where we have reason to believe:
            </p>
            <ul className="list-disc list-inside mb-4">
                <li><strong>(i)</strong> That your Wallet is being used for illegal money laundering or for any other illegal activity.</li>
                <li><strong>(ii)</strong> You have concealed or reported false identification information or other details.</li>
            </ul>
        </div>

        <div className="container mx-auto p-6">
            <h2 className="text-2xl font-bold underline mb-4">3. OFFERINGS AND PAYMENT</h2>

            <h3 className="text-xl font-semibold mt-4">3.1 Offerings</h3>
            <p className="mb-4">
                The Services may permit you to purchase (including purchases made as a gift or tip to another user) certain products or services, including
                <strong> Third-Party Offerings</strong> and other products or services of third parties that are offered through the Services (<strong>“Offerings”</strong>).
                We do not warrant that Offering descriptions are accurate, complete, reliable, current, or error-free.
                The inclusion of any Offerings for purchase through the Services at a particular time does not imply or warrant that the Offerings will be available at any other time.
            </p>

            <h3 className="text-xl font-semibold mt-4">3.2 Fees</h3>
            <p className="mb-4">
                The Company may charge or pass through fees for some or part of the Services we make available to you, including transaction or processing fees
                for Offerings or other transactions conducted through the Protocol. Use of the Services to interact with the Protocol may also cause you to incur
                blockchain gas or other network fees.
            </p>
            <p className="mb-4">
                We will disclose the amount of fees we will charge or pass through to you for the applicable Services or Offering at the time you access, use, or
                otherwise transact with the Services or Offering. Although we will attempt to provide accurate fee information, any such information reflects our estimate of fees,
                which may vary from the fees actually paid to use the Services or purchase the Offering and interact with the applicable blockchain with which the Services or
                Offering are compatible.
            </p>
            <p className="mb-4">
                Additionally, your Wallet provider may impose a fee to transact on the Services. We are not responsible for any fees charged by a third party.
                <strong> All transactions processed through the Services are non-refundable.</strong> You will be responsible for paying any and all taxes, duties,
                and assessments now or hereafter claimed or imposed by any governmental authority associated with your use of the Services or purchase of any Offering.
            </p>
            <p className="mb-4">
                To facilitate transactions on the Services, we have integrated with one or more third-party blockchains, exchanges, and services.
                We do not own or control these third-party services, and we do not control the transfer of cryptocurrency using these third-party services nor do we have the
                ability to cancel or reverse certain transactions.
            </p>
            <p className="mb-4">
                In certain cases, your transactions through the Services may not be successful due to an error with the blockchain or the Wallet.
                We accept no responsibility or liability to you for any such failed transactions or any transaction or gas fees that may be incurred by you in connection with such
                failed transactions. You acknowledge and agree that all information you provide with respect to transactions on the Services is accurate,
                current, and complete, and you have the legal right to use such payment method.
            </p>

            <h3 className="text-xl font-semibold mt-4">3.3 Coupon Codes</h3>
            <p className="mb-4">
                The Services may offer certain promotional codes, referral codes, discount codes, coupon codes, or similar offers (<strong>“Coupon Codes”</strong>) that may be
                redeemed for discounts on future Offerings, or other features or benefits related to the Services, subject to any additional terms that the Company or the user
                providing such Coupon Code establishes. You agree that Coupon Codes:
            </p>
            <ul className="list-disc list-inside mb-4">
                <li><strong>(a)</strong> Must be used in a lawful manner.</li>
                <li><strong>(b)</strong> Must be used for the intended audience and purpose.</li>
                <li><strong>(c)</strong> May not be duplicated, sold, or transferred in any manner, or made available by you to the general public (whether posted to a public forum,
                    coupon collecting service, or otherwise), unless expressly permitted by the Company or the user offering such Coupon Code.</li>
                <li><strong>(d)</strong> May be disabled or have additional conditions applied to them by the offeror of such Coupon Code at any time for any reason without liability to the offeror.</li>
                <li><strong>(e)</strong> May only be used pursuant to the specific terms that the offeror establishes for such Coupon Code.</li>
                <li><strong>(f)</strong> Are not valid for cash or other credits or points.</li>
                <li><strong>(g)</strong> May expire prior to your use.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4">3.4 User-Generated Rewards</h3>
            <p className="mb-4">
                In addition, creators and their communities may initiate milestone- or points-based systems or rewards, such as badges, collectibles, achievements,
                battle-pass-style mechanics, and other similar systems or rewards (collectively, <strong>“User-Generated Rewards”</strong>). While the Services may be used to display
                User-Generated Rewards, the Company is not responsible for User-Generated Rewards, and any User-Generated Rewards are subject to separate terms and conditions
                established by the user that created such User-Generated Rewards program.
            </p>

            <h3 className="text-xl font-semibold mt-4">3.5 Disclaimer Regarding Third-Party Offerings</h3>
            <p className="mb-4">
                <strong>Third-Party Offerings</strong> made available on the Services do not indicate an affiliation with or endorsement by us of any such Offerings.
                Accordingly, we do not provide any warranties with respect to Third-Party Offerings. If you have a dispute with any provider of a Third-Party Offering,
                you release the Company Entities from claims, demands, and damages (actual and consequential) of every kind and nature, known and unknown, arising out of
                or in any way connected with such disputes.
            </p>
            <p className="mb-4">
                In entering into this release, you expressly waive any protections (whether statutory or otherwise) that would otherwise limit the coverage of this release
                to include only those claims which you may know or suspect to exist in your favor at the time of agreeing to this release.
            </p>
            <p className="mb-4">
                Without limiting the foregoing, you agree that:
            </p>
            <ul className="list-disc list-inside mb-4">
                <li><strong>(i)</strong> The applicable provider of Third-Party Offerings, not us, is responsible for providing any such Third-Party Offering you purchase or otherwise claim through the Services.</li>
                <li><strong>(ii)</strong> We are not party to any sales agreements between you and the provider of any Third-Party Offerings, and we are not responsible for any breach or default by such provider.</li>
            </ul>
        </div>

        <div className="container mx-auto p-6">
            <h2 className="text-2xl font-bold underline mb-4">4. USING THE SERVICES TO SHARE OFFERINGS AND PROMOTIONS</h2>

            <h3 className="text-xl font-semibold mt-4">4.1 Using the Services to Share Offerings</h3>
            <p className="mb-4">
                The Services may allow you to promote, sell, offer, or otherwise make available content, goods, or services to other users via the Services,
                including Coupon Codes, Promotions (as defined below), and associated User-Generated Rewards (<strong>“Third-Party Offerings”</strong>).
                Third-Party Offerings may include:
            </p>
            <ul className="list-disc list-inside mb-4">
                <li><strong>(a)</strong> Non-fungible tokens or similar digital items (<strong>“Third-Party Digital Collectibles”</strong>).</li>
                <li><strong>(b)</strong> Access to exclusive content.</li>
                <li><strong>(c)</strong> Physical goods (e.g., merchandise).</li>
            </ul>
            <p className="mb-4">
                You represent, warrant, and covenant that:
            </p>
            <ul className="list-disc list-inside mb-4">
                <li><strong>(i)</strong> You have all necessary permissions, approvals, authorizations, licenses, and consents to promote, sell, offer, or otherwise make available Third-Party Offerings via the Services.</li>
                <li><strong>(ii)</strong> Your Third-Party Offerings, including marketing and other related activities, comply with all applicable laws.</li>
                <li><strong>(iii)</strong> Your Third-Party Offerings are not illegal or counterfeit and do not infringe, misappropriate, or otherwise violate any third party’s rights.</li>
                <li><strong>(iv)</strong> You are responsible for making available any terms and conditions required under applicable law in connection with the promotion or sale of Third-Party Offerings.</li>
                <li><strong>(v)</strong> You are responsible for providing any license terms applicable to your Third-Party Digital Collectibles.</li>
                <li><strong>(vi)</strong> You are responsible for processing, providing, and (if applicable) shipping Third-Party Offerings, including providing any benefits or rights associated with Third-Party Digital Collectibles.</li>
                <li><strong>(vii)</strong> You are responsible for complying with all applicable tax laws and rules in connection with your sale of Third-Party Offerings.</li>
            </ul>
            <p className="mb-4">
                You are solely responsible for resolving any dispute with any user related to Third-Party Offerings. You release the Company Entities from all claims,
                demands, and damages arising out of or in any way connected with such disputes. The Company reserves the right to be the final decision-maker in
                connection with such disputes, and you agree to abide by the Company’s decision.
            </p>
            <p className="mb-4">
                We reserve the right to suspend, remove, or prevent your Third-Party Offerings from the Services for any reason, including if we determine in our sole
                discretion that your Third-Party Offerings do not comply with these Terms or applicable law.
            </p>

            <h3 className="text-xl font-semibold mt-4">4.2 Promotions</h3>
            <p className="mb-4">
                You may be able to administer, offer, or otherwise make available various challenges, contests, bounties, or other promotions (<strong>“Promotion”</strong>)
                through the Services. If you make a Promotion available through the Services, you agree that:
            </p>
            <ul className="list-disc list-inside mb-4">
                <li><strong>(i)</strong> You will provide clear, accurate, and complete requirements and criteria for your Promotion.</li>
                <li><strong>(ii)</strong> Your Promotion, including all marketing activities, rules, and other criteria, will comply with all applicable laws, including obtaining all necessary consents, registrations, and bonds.</li>
                <li><strong>(iii)</strong> You will be deemed the sponsor, promoter, and operator of such Promotion and may not indicate that we endorse or are otherwise affiliated with your Promotion.</li>
                <li><strong>(iv)</strong> As between you and the Company, you are responsible for all costs and expenses incurred in connection with such Promotion.</li>
                <li><strong>(v)</strong> As between you and the Company, you are responsible for providing any User-Generated Rewards offered in connection with such Promotion.</li>
                <li><strong>(vi)</strong> You are solely responsible for resolving any dispute with any user that enters or participates in your Promotion, and you release the Company Entities from all claims, demands, and damages arising out of or in any way connected with such disputes.</li>
            </ul>
            <p className="mb-4">
                The Company reserves the right to be the final decision-maker in connection with such disputes, and you agree to abide by the Company’s decision.
            </p>
            <p className="mb-4">
                We reserve the right to suspend, remove, or prevent your Promotion from the Services for any reason, including if we determine in our sole discretion that your Promotion does not comply with these Terms or applicable law.
            </p>
        </div>


        <div className="container mx-auto p-6">
            <h2 className="text-2xl font-bold underline mb-4">5. LOCATION OF OUR PRIVACY POLICY AND OTHER POLICIES</h2>

            <h3 className="text-xl font-semibold mt-4">5.1 Privacy Policy</h3>
            <p className="mb-4">
                Our Privacy Policy describes how we handle the information you provide to us when you use the Services.
                For an explanation of our privacy practices, please visit our Privacy Policy located at
                <a href="https://www.wildcardalliance.com/privacy" className="text-blue-500 underline"> www.wildcardalliance.com/privacy</a>.
            </p>
        </div>


        <div className="container mx-auto p-6">
            <h2 className="text-2xl font-bold underline mb-4">6. RIGHTS WE GRANT YOU</h2>

            <h3 className="text-xl font-semibold mt-4">6.1 Right to Use Services</h3>
            <p className="mb-4">
                We hereby permit you to use the Services for your internal use only, provided that you comply with these Terms in connection with all such use.
                If any software, content, or other materials owned or controlled by us are distributed to you as part of your use of the Services,
                we hereby grant you a personal, non-assignable, non-sublicensable, non-transferrable, and non-exclusive right and license to access and display
                such software, content, and materials provided to you as part of the Services, in each case for the sole purpose of enabling you to use the Services as permitted by these Terms.
            </p>
            <p className="mb-4">
                Your access and use of the Services may be interrupted from time to time for any of several reasons, including, without limitation, the malfunction of equipment,
                periodic updating, maintenance or repair of the Services, or other actions that the Company, in its sole discretion, may elect to take.
            </p>

            <h3 className="text-xl font-semibold mt-4">6.2 Restrictions on Your Use of the Services</h3>
            <p className="mb-4">
                You may not do any of the following in connection with your use of the Services, unless applicable laws or regulations prohibit these restrictions or you have our written permission to do so:
            </p>
            <ul className="list-disc list-inside mb-4">
                <li><strong>(a)</strong> Download, modify, copy, distribute, transmit, display, perform, reproduce, duplicate, publish, license, create derivative works from, or offer for sale any information contained on, or obtained from or through, the Services, except for temporary files that are automatically cached by your web browser for display purposes, or as otherwise expressly permitted in these Terms.</li>
                <li><strong>(b)</strong> Duplicate, decompile, reverse engineer, disassemble, or decode the Services (including any underlying idea or algorithm), or attempt to do any of the same, except as expressly permitted by these Terms or applicable law despite this restriction.</li>
                <li><strong>(c)</strong> Use, reproduce, or remove any copyright, trademark, service mark, trade name, slogan, logo, image, or other proprietary notation displayed on or through the Services.</li>
                <li><strong>(d)</strong> Use automation software (bots), hacks, modifications (mods), or any other unauthorized third-party software designed to modify the Services.</li>
                <li><strong>(e)</strong> Exploit the Services for any commercial purpose, including without limitation communicating or facilitating any commercial advertisement or solicitation.</li>
                <li><strong>(f)</strong> Access or use the Services in any manner that could disable, overburden, damage, disrupt, or impair the Services or Protocol, or interfere with any other party’s access to or use of the Services or Protocol, or use any device, software, or routine that causes the same.</li>
                <li><strong>(g)</strong> Attempt to gain unauthorized access to, interfere with, damage, or disrupt the Services or Protocol, accounts registered to other users, or the computer systems, wallets, accounts, protocols, or networks connected to the Services.</li>
                <li><strong>(h)</strong> Circumvent, remove, alter, deactivate, degrade, or thwart any technological measure or content protections of the Services or the computer systems, wallets, accounts, protocols, or networks connected to the Services.</li>
                <li><strong>(i)</strong> Use any robot, spider, crawler, or other automatic device, process, software, or queries that intercept, “mines,” scrapes, or otherwise accesses the Services to monitor, extract, copy, or collect information or data from or through the Services, or engage in any manual process to do the same.</li>
                <li><strong>(j)</strong> Introduce any viruses, trojan horses, worms, logic bombs, or other materials that are malicious or technologically harmful into our systems.</li>
                <li><strong>(k)</strong> Submit, transmit, display, perform, post, or store any content, or otherwise use the Services or engage in conduct related to the Services, that is unlawful, defamatory, obscene, excessively violent, pornographic, invasive of privacy or publicity rights, threatening, harassing, abusive, hateful, or cruel, or that incites, organizes, promotes, or facilitates violence or criminal activities.</li>
                <li><strong>(l)</strong> Violate any applicable law or regulation in connection with your access to or use of the Services.</li>
                <li><strong>(m)</strong> Access or use the Services in any way not expressly permitted by these Terms.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4">6.3 Interactions with Other Users on the Services</h3>
            <p className="mb-4">
                You are responsible for your interactions with other users on or through the Services. While we reserve the right to monitor interactions between users,
                we are not obligated to do so, and we cannot be held liable for your interactions with other users or for any user’s actions or inactions.
            </p>
            <p className="mb-4">
                If you have a dispute with one or more users, you release us (and our affiliates and subsidiaries, and our and their respective officers, directors,
                employees, and agents) from claims, demands, and damages (actual and consequential) of every kind and nature, known and unknown, arising out of or in any way
                connected with such disputes.
            </p>
            <p className="mb-4">
                In entering into this release, you expressly waive any protections (whether statutory or otherwise) that would otherwise limit the coverage of this release
                to include only those claims which you may know or suspect to exist in your favor at the time of agreeing to this release.
            </p>
        </div>


        <div className="container mx-auto p-6">
            <h2 className="text-2xl font-bold underline mb-4">7. OWNERSHIP AND CONTENT</h2>

            <h3 className="text-xl font-semibold mt-4">7.1 Ownership of the Services</h3>
            <p className="mb-4">
                The Services, including their “look and feel” (e.g., text, graphics, images, logos), proprietary content, information, and other materials,
                are protected under copyright, trademark, and other intellectual property laws. You agree that the Company and/or its licensors own all right,
                title, and interest in and to the Services (including any and all intellectual property rights therein), and you agree not to take any actions inconsistent with such ownership interests.
                We and our licensors reserve all rights in connection with the Services and its content, including, without limitation, the exclusive right to create derivative works.
            </p>

            <h3 className="text-xl font-semibold mt-4">7.2 Ownership of Trademarks</h3>
            <p className="mb-4">
                The Company’s name, trademarks, and logos, along with all related names, logos, product and service names, designs, and slogans, are trademarks of the Company or its affiliates or licensors.
                Other names, logos, product and service names, designs, and slogans that appear on the Services are the property of their respective owners, who may or may not be affiliated with,
                connected to, or sponsored by us.
            </p>

            <h3 className="text-xl font-semibold mt-4">7.3 Ownership of Feedback</h3>
            <p className="mb-4">
                We welcome feedback, bug reports, comments, and suggestions for improvements to the Services (<strong>“Feedback”</strong>).
                You acknowledge and expressly agree that any contribution of Feedback does not and will not grant you any right, title, or interest in the Services or in any such Feedback.
                All Feedback becomes the sole and exclusive property of the Company, and the Company may use and disclose Feedback in any manner and for any purpose whatsoever
                without further notice or compensation to you.
            </p>

            <h3 className="text-xl font-semibold mt-4">7.4 Content License Grant</h3>
            <p className="mb-4">
                (a) By using the Services and uploading <strong>User Content</strong>, you grant us a license to access, use, host, cache, store, reproduce, transmit, display, publish,
                distribute, modify, and create derivative works from User Content, and to use the name, identity, likeness, and voice (or other biographical information) that you submit
                in connection with User Content. You acknowledge that we can exercise these rights in connection with advertising and monetizing the Services.
                These rights and licenses are royalty-free, transferable, sub-licensable, worldwide, and irrevocable (for so long as User Content is stored with us).
            </p>
            <p className="mb-4">
                (b) Other users of the Services may comment on and/or tag User Content and/or use, publish, display, modify, or include a copy of User Content as part of their own use of the Services,
                except for User Content that you post privately for non-public display on the Services.
            </p>
            <p className="mb-4">
                (c) The Company reserves the right to remove, screen, edit, or delete any User Content at any time, for any reason, without notice. By posting or submitting User Content,
                you represent and warrant that you have obtained all necessary rights, licenses, consents, permissions, and authority to grant the rights granted herein for User Content.
            </p>
            <p className="mb-4">
                (d) You are responsible for ensuring your <strong>Branded Content</strong> complies with these Terms, our Community Guidelines, and all applicable laws and regulations,
                including the U.S. Federal Trade Commission&apos;s Guidelines (<strong>“Advertising Guidelines”</strong>). If you have been paid or provided with free products in exchange for promoting a product or service,
                or if you are an employee discussing your company&apos;s products or services, you must comply with the Advertising Guidelines&apos; requirements for disclosing such relationships.
            </p>

            <h3 className="text-xl font-semibold mt-4">7.5 Notice of Infringement – DMCA (Copyright) Policy</h3>
            <p className="mb-4">
                If you believe that any text, graphics, photos, audio, videos, or other materials uploaded, downloaded, or appearing on the Services have been copied in a way that constitutes copyright infringement,
                you may submit a notification to our copyright agent in accordance with 17 USC 512(c) of the Digital Millennium Copyright Act (<strong>“DMCA”</strong>), by providing the following information in writing:
            </p>
            <ul className="list-disc list-inside mb-4">
                <li><strong>(a)</strong> Identification of the copyrighted work that is claimed to be infringed.</li>
                <li><strong>(b)</strong> Identification of the allegedly infringing material that is requested to be removed, including a description of where it is located on the Services.</li>
                <li><strong>(c)</strong> Information for our copyright agent to contact you, such as an address, telephone number, and email address.</li>
                <li><strong>(d)</strong> A statement that you have a good faith belief that the identified, allegedly infringing use is not authorized by the copyright owner, its agent, or the law.</li>
                <li><strong>(e)</strong> A statement that the information above is accurate, and under penalty of perjury, that you are the copyright owner or the authorized person to act on behalf of the copyright owner.</li>
                <li><strong>(f)</strong> The physical or electronic signature of a person authorized to act on behalf of the owner of the copyright or an exclusive right that is allegedly infringed.</li>
            </ul>
            <p className="mb-4">
                Notices of copyright infringement claims should be sent by mail to: <strong>Copyright Agent c/o The Wildcard Alliance, 110 E. Davis St, McKinney, Texas 75069</strong>;
                or by email to <a href="mailto:legal@wildcardalliance.com" className="text-blue-500 underline">legal@wildcardalliance.com</a>.
                We will endeavor to respond expeditiously to any such valid notices to remove infringing content from the Services.
            </p>
            <p className="mb-4">
                It is our policy, in appropriate circumstances and at our discretion, to disable or terminate the accounts of users who repeatedly infringe copyrights or intellectual property rights of others.
            </p>
            <p className="mb-4">
                A user of the Services who has uploaded or posted materials identified as infringing may supply a counter-notification pursuant to sections 512(g)(2) and (3) of the DMCA.
                When we receive a counter-notification, we may reinstate the posts or material in question, in our sole discretion. To file a counter-notification,
                you must provide a written communication (by regular mail or by email) that sets forth all of the items required by sections 512(g)(2) and (3) of the DMCA.
                Please note that you will be liable for damages if you materially misrepresent that content or an activity is not infringing the copyrights of others.
            </p>
        </div>


        <div className="container mx-auto p-6">
            <h2 className="text-2xl font-bold underline mb-4">8. THIRD-PARTY SERVICES AND MATERIALS</h2>

            <h3 className="text-xl font-semibold mt-4">8.1 Third-Party Services and Materials</h3>
            <p className="mb-4">
                The Services may display, include, or make available services, content, data, information, applications, or materials from third parties
                (<strong>“Third-Party Services and Materials”</strong>) or provide links to certain third-party websites. The Company does not endorse any Third-Party Services and Materials.
                You agree that your access and use of such Third-Party Services and Materials is governed solely by the terms and conditions of such Third-Party Services and Materials, as applicable.
            </p>
            <p className="mb-4">
                The Company is not responsible or liable for, and makes no representations as to, any aspect of such Third-Party Services and Materials, including, without limitation:
            </p>
            <ul className="list-disc list-inside mb-4">
                <li>Their content or the manner in which they handle, protect, manage, or process data.</li>
                <li>Any interaction between you and the provider of such Third-Party Services and Materials.</li>
                <li>The examination or evaluation of content, accuracy, completeness, availability, timeliness, validity, copyright compliance, legality, decency, quality, or any other aspect of such Third-Party Services and Materials or websites.</li>
            </ul>
            <p className="mb-4">
                You irrevocably waive any claim against the Company with respect to such Third-Party Services and Materials.
                We are not liable for any damage or loss caused or alleged to be caused by or in connection with your enablement, access, or use of any such Third-Party Services and Materials,
                or your reliance on the privacy practices, data security processes, or other policies of such Third-Party Services and Materials.
            </p>
            <p className="mb-4">
                Third-Party Services and Materials and links to other websites are provided solely as a convenience to you.
            </p>
        </div>


        <div className="container mx-auto p-6">
            <h2 className="text-2xl font-bold underline mb-4">9. DISCLAIMERS, LIMITATIONS OF LIABILITY, AND INDEMNIFICATION</h2>

            <h3 className="text-xl font-semibold mt-4">9.1 Disclaimers</h3>
            <p className="mb-4">
                (a) Your access to and use of the Services (and the Protocol) are at your own risk. You understand and agree that the Services are provided to you on an
                <strong>“AS IS”</strong> and <strong>“AS AVAILABLE”</strong> basis. Without limiting the foregoing, to the maximum extent permitted under applicable law,
                the Company, its parents, affiliates, related companies, officers, directors, employees, agents, representatives, partners, and licensors
                (<strong>“Company Entities”</strong>) DISCLAIM ALL WARRANTIES AND CONDITIONS, WHETHER EXPRESS, IMPLIED OR STATUTORY, INCLUDING WITHOUT LIMITATION ANY WARRANTIES RELATING TO
                TITLE, MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, USAGE, QUALITY, PERFORMANCE, OR SUITABILITY.
            </p>
            <p className="mb-4">
                The Company Entities make no warranty or representation and disclaim all responsibility and liability for:
            </p>
            <ul className="list-disc list-inside mb-4">
                <li>(a) The completeness, accuracy, availability, timeliness, security, or reliability of the Services and the Protocol.</li>
                <li>(b) Any harm to your computer system, loss of data, or other harm resulting from your access to or use of the Services or the Protocol.</li>
                <li>(c) The operation or compatibility with any other application, system, or device, including Wallets.</li>
                <li>(d) Whether the Services or the Protocol will meet your requirements or be available on an uninterrupted, secure, or error-free basis.</li>
                <li>(e) Whether the Services or the Protocol will protect your assets from theft, hacking, cyber-attacks, or loss caused by third parties.</li>
                <li>(f) The deletion of, or failure to store or transmit, User Content and communications maintained by the Services.</li>
            </ul>
            <p className="mb-4">
                (b) The laws of certain jurisdictions, including the State of New Jersey, may not allow limitations on implied warranties or exclusion of certain damages.
            </p>
            <p className="mb-4">
                (c) The Company Entities take no responsibility for any content that you, another user, or a third party creates, uploads, posts, sends, receives, or stores on or through our Services.
            </p>
            <p className="mb-4">
                (d) You understand and agree that you may be exposed to content that might be offensive, illegal, misleading, or otherwise inappropriate, none of which the Company Entities will be responsible for.
            </p>

            <h3 className="text-xl font-semibold mt-4">9.2 Limitations of Liability</h3>
            <p className="mb-4">
                TO THE EXTENT NOT PROHIBITED BY LAW, YOU AGREE THAT IN NO EVENT WILL THE COMPANY ENTITIES BE LIABLE FOR DAMAGES OF ANY KIND, INCLUDING INDIRECT, SPECIAL, EXEMPLARY,
                INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OR INABILITY TO USE THE SERVICES.
            </p>
            <p className="mb-4">
                THE COMPANY ENTITIES’ TOTAL LIABILITY TO YOU FOR ANY DAMAGES SHALL NOT EXCEED THE GREATER OF ONE HUNDRED DOLLARS ($100.00) OR THE AMOUNT YOU PAID THE COMPANY ENTITIES
                IN THE PAST SIX (6) MONTHS FOR THE SERVICES GIVING RISE TO THE CLAIM.
            </p>

            <h3 className="text-xl font-semibold mt-4">9.3 Acknowledgement; Assumption of Risks</h3>
            <p className="mb-4">
                (a) We will use reasonable security measures to attempt to protect User Content against unauthorized copying and distribution. However, we cannot guarantee
                that any unauthorized copying, use, or distribution of User Content by third parties will not take place. You waive any claims against the Company Entities for such unauthorized copying or usage.
            </p>
            <p className="mb-4">
                (b) By using the Services that interact with the Protocol, you represent that you have sufficient knowledge of blockchain technologies, cryptocurrencies,
                storage mechanisms (such as Wallets), and blockchain-based systems to assess the risks and benefits of interacting with the Protocol.
                Since transactions on the Protocol execute automatically via smart contracts, we do not have the ability to reverse them.
            </p>
            <p className="mb-4">
                (c) Smart contracts execute automatically when conditions are met. We do not have the ability to reverse a transaction recorded on a public blockchain.
                You are responsible for ensuring the accuracy of any transaction details. We are not responsible for losses due to your errors or vulnerabilities in smart contract programming.
            </p>

            <h3 className="text-xl font-semibold mt-4">9.4 Indemnification</h3>
            <p className="mb-4">
                By entering into these Terms and accessing or using the Services, you agree to defend, indemnify, and hold the Company Entities harmless from and against any and all claims, costs, damages, losses,
                liabilities, and expenses (including attorneys’ fees) incurred by the Company Entities arising out of or in connection with:
            </p>
            <ul className="list-disc list-inside mb-4">
                <li>(a) Your violation or breach of any term of these Terms or any applicable law.</li>
                <li>(b) Your violation of any rights of any third party.</li>
                <li>(c) Your misuse of the Services.</li>
                <li>(d) Your negligence or willful misconduct.</li>
                <li>(e) Any Third-Party Offering, Promotion, or User-Generated Rewards you make available through the Services.</li>
                <li>(f) User Content.</li>
            </ul>
            <p className="mb-4">
                If you are obligated to indemnify any Company Entity, the Company will have the right, in its sole discretion, to control any action or proceeding and determine whether to settle,
                and if so, on what terms. You agree to fully cooperate with the Company in defense or settlement of any claim.
            </p>

            <h3 className="text-xl font-semibold mt-4">9.5 Third-Party Beneficiaries</h3>
            <p className="mb-4">
                You and the Company acknowledge and agree that the Company Entities (other than the Company) are third-party beneficiaries of these Terms.
            </p>
        </div>


        <div className="container mx-auto p-6">
            <h2 className="text-2xl font-bold underline mb-4">10. ARBITRATION AND CLASS ACTION WAIVER</h2>

            <h3 className="text-xl font-semibold mt-4">10.1 Important Notice</h3>
            <p className="mb-4">
                PLEASE READ THIS SECTION CAREFULLY – IT MAY SIGNIFICANTLY AFFECT YOUR LEGAL RIGHTS, INCLUDING YOUR RIGHT TO FILE A LAWSUIT IN COURT
                AND TO HAVE A JURY HEAR YOUR CLAIMS. IT CONTAINS PROCEDURES FOR MANDATORY BINDING ARBITRATION AND A CLASS ACTION WAIVER.
            </p>

            <h3 className="text-xl font-semibold mt-4">10.2 Informal Process First</h3>
            <p className="mb-4">
                You and the Company agree that in the event of any dispute between you and the Company Entities, either party will first contact the other
                and make a good faith sustained effort to resolve the dispute before resorting to more formal means of resolution, including any court action.
                The receiving party will have 30 days to respond. This dispute resolution procedure must be satisfied before initiating arbitration.
            </p>

            <h3 className="text-xl font-semibold mt-4">10.3 Arbitration Agreement and Class Action Waiver</h3>
            <p className="mb-4">
                After the informal dispute resolution process, any remaining dispute, controversy, or claim (<strong>“Claim”</strong>) relating to the Services
                will be resolved by arbitration. This includes any use or access or lack of access to the Services and any usage of the Protocol.
                Arbitration will be handled by a sole arbitrator in accordance with the <strong>JAMS Comprehensive Arbitration Rules and Procedures</strong>
                (<strong>“JAMS Rules”</strong>).
            </p>
            <p className="mb-4">
                The Federal Arbitration Act (<strong>“FAA”</strong>) governs the arbitrability of all disputes. The arbitrator will apply applicable substantive law
                and the statute of limitations. Judgment on the arbitration award may be entered in any court with jurisdiction.
            </p>
            <p className="mb-4">
                Any arbitration under these Terms will take place on an <strong>individual basis</strong>. Class arbitrations and class actions are not permitted.
                By agreeing to these Terms, you and the Company waive the right to trial by jury or to participate in a class action or class arbitration.
            </p>

            <h3 className="text-xl font-semibold mt-4">10.4 Exceptions</h3>
            <p className="mb-4">
                Notwithstanding the foregoing, the following disputes will be resolved in a court of proper jurisdiction:
            </p>
            <ul className="list-disc list-inside mb-4">
                <li>(i) Disputes or claims within the jurisdiction of a small claims court, provided they are brought as individual disputes.</li>
                <li>(ii) Disputes or claims where the sole form of relief sought is injunctive relief, including public injunctive relief.</li>
                <li>(iii) Intellectual property disputes.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4">10.5 Costs of Arbitration</h3>
            <p className="mb-4">
                Payment of arbitration fees will be governed by the <strong>JAMS Rules</strong>. If you demonstrate that arbitration costs are prohibitively expensive,
                the Company may pay the necessary amount to make arbitration comparable to a court proceeding.
            </p>
            <p className="mb-4">
                Fees and costs may be awarded as provided by applicable law. If the arbitrator finds your claim frivolous or brought for an improper purpose,
                you agree to reimburse the Company for any costs paid on your behalf.
            </p>

            <h3 className="text-xl font-semibold mt-4">10.6 Batch Arbitration</h3>
            <p className="mb-4">
                If 100 or more individual Claims of a substantially similar nature are filed against the Company within a 30-day period, arbitration will be
                conducted in <strong>batch arbitration</strong>. This means:
            </p>
            <ul className="list-disc list-inside mb-4">
                <li>(a) JAMS will administer arbitrations in batches of 100 Claims per batch.</li>
                <li>(b) One arbitrator will be appointed per batch.</li>
                <li>(c) The resolution of each batch will be treated as a single consolidated arbitration with one set of fees per batch.</li>
            </ul>
            <p className="mb-4">
                If disputes arise over the application of Batch Arbitration, a separate <strong>Administrative Arbitrator</strong> will be appointed to resolve the issue.
            </p>

            <h3 className="text-xl font-semibold mt-4">10.7 Opt-Out</h3>
            <p className="mb-4">
                You have the right to opt-out of the arbitration provisions in these Terms by sending written notice to
                <a href="mailto:legal@wildcardalliance.com" className="text-blue-500 underline"> legal@wildcardalliance.com</a> within 30 days of first registering to use the Services
                or agreeing to these Terms. If you opt out of arbitration but not the class action waiver, the class action waiver still applies.
                You may not opt out of the class action waiver while still agreeing to arbitration.
            </p>

            <h3 className="text-xl font-semibold mt-4">10.8 Waiver of Right to Bring Class Action and Representative Claims</h3>
            <p className="mb-4">
                To the fullest extent permitted by law, you and the Company agree that any dispute, claim, or controversy will be brought and conducted
                <strong>only on an individual basis</strong> and <strong>not as part of any class</strong>, consolidated, multiple-plaintiff, or representative action.
            </p>
            <p className="mb-4">
                <strong>You and the Company agree to waive the right to participate as a plaintiff or class member in any class action.</strong>
                No class actions, collective actions, or joint proceedings are permitted in arbitration.
                The arbitrator may not consolidate claims or conduct a class arbitration.
            </p>
            <p className="mb-4">
                If a court rules that this class action waiver is unenforceable, the arbitration agreement will be null and void with respect to the class action.
            </p>
        </div>


        <div className="container mx-auto p-6">
            <h2 className="text-2xl font-bold underline mb-4">11. ADDITIONAL PROVISIONS</h2>

            <h3 className="text-xl font-semibold mt-4">11.1 Updating These Terms</h3>
            <p className="mb-4">
                We may modify these Terms from time to time, in which case we will update the “Last Revised” date at the top of these Terms.
                If we make material changes, we will use reasonable efforts to notify you, such as by email or by placing a prominent notice on the first page of the Interface.
                However, it is your sole responsibility to review these Terms periodically. The updated Terms will be effective at the time of posting or on a later date specified in the updated Terms.
                Your continued access or use of the Services after modifications become effective will be deemed acceptance of the modified Terms.
                No amendment shall apply to a dispute where arbitration was initiated prior to the change in Terms.
            </p>

            <h3 className="text-xl font-semibold mt-4">11.2 Suspension; Termination</h3>
            <p className="mb-4">                
                If you breach any of these Terms, all licenses granted by the Company will terminate automatically. Additionally, the Company may, in its sole discretion, suspend, restrict, or terminate your Account and/or access to the Services, in whole or in part, with or without notice, for any or no reason, including:
            </p>
            <ul className="list-disc list-inside mb-4">
                <li>(i) If we believe you have engaged in prohibited activities under these Terms.</li>
                <li>(ii) If you provide incomplete, incorrect, or false information.</li>
                <li>(iii) If you have breached any portion of these Terms.</li>
                <li>(iv) If we determine that such action is necessary to comply with these Terms, policies, laws, or regulations.</li>
                <li>(v) If you engage in threats, harassment, abuse, intimidation, stalking, or other harmful conduct directed at the Company or its officers, directors, employees, contractors, community members, partners, customers, or other users, whether such conduct occurs on or off the Services, and whether or not such conduct violates any law, where we reasonably believe that such conduct may affect the safety, well-being, integrity, or operation of the Services or the Company community.</li>
            </ul>
            <p className="mb-4">
                If your Account is deleted for any suspected breach, you are prohibited from re-registering under a different name. The Company may, but is not obligated to, delete any of your User Content. The Company is not responsible for failure to delete or for deletion of User Content. Any sections that should survive termination will continue in full force and effect.
            </p>
            <ul className="list-disc list-inside mb-4">
                <li>(i) If we believe you have engaged in prohibited activities under these Terms.</li>
                <li>(ii) If you provide incomplete, incorrect, or false information.</li>
                <li>(iii) If you have breached any portion of these Terms.</li>
                <li>(iv) If we determine that such action is necessary to comply with these Terms, policies, laws, or regulations.</li>
            </ul>
            <p className="mb-4">
                If your Account is deleted for any suspected breach, you are prohibited from re-registering under a different name.
                The Company may, but is not obligated to, delete any of your User Content. The Company is not responsible for failure to delete or for deletion of User Content.
                Any sections that should survive termination will continue in full force and effect.
            </p>

            <h3 className="text-xl font-semibold mt-4">11.3 Injunctive Relief</h3>
            <p className="mb-4">
                You agree that a breach of these Terms may cause irreparable injury to the Company, for which monetary damages may not be adequate.
                The Company shall be entitled to equitable relief in addition to other remedies without requiring proof of damages.
            </p>

            <h3 className="text-xl font-semibold mt-4">11.4 California Residents</h3>
            <p className="mb-4">
                If you are a California resident, you may report complaints to the Complaint Assistance Unit of the Division of Consumer Services of the
                California Department of Consumer Affairs by contacting them in writing at:
            </p>
            <p className="mb-4">
                <strong>1625 North Market Blvd., Suite N 112, Sacramento, CA 95834</strong>
            </p>
            <p className="mb-4">
                Or by telephone at: <strong>(800) 952-5210</strong>
            </p>

            <h3 className="text-xl font-semibold mt-4">11.5 Export Laws</h3>
            <p className="mb-4">
                You agree not to export or re-export the Services and/or any related materials provided by the Company to any country requiring an export license
                without first obtaining such approval. Specifically, the Services may not be exported:
            </p>
            <ul className="list-disc list-inside mb-4">
                <li>(a) To any U.S.-embargoed countries or countries designated as “terrorist-supporting” by the U.S. Government.</li>
                <li>(b) To individuals or entities listed on U.S. Government lists of prohibited or restricted parties, including the U.S. Treasury Department’s
                    list of Specially Designated Nationals or the U.S. Department of Commerce Denied Persons List or Entity List.</li>
            </ul>
            <p className="mb-4">
                By using the Services, you represent that you are not located in any such country or on any such list. You are responsible for complying with all applicable
                export laws and regulations at your sole expense.
            </p>

            <h3 className="text-xl font-semibold mt-4">11.6 Force Majeure</h3>
            <p className="mb-4">
                The Company will not be liable for any failure or delay in fulfilling its obligations under these Terms when caused by circumstances beyond its control, including:
            </p>
            <ul className="list-disc list-inside mb-4">
                <li>Acts of God (flood, fire, earthquake, etc.).</li>
                <li>War, invasion, terrorist threats, or civil unrest.</li>
                <li>Government orders, embargoes, or blockades.</li>
                <li>Labor strikes, shortages, or industrial disturbances.</li>
                <li>Telecommunication failures or power shortages.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4">11.7 Miscellaneous</h3>
            <p className="mb-4">
                If any provision of these Terms is unlawful, void, or unenforceable, it shall be severable, and the remaining provisions shall remain in full force and effect.
                The Company may assign these Terms, but you may not do so without the Company’s express written consent.
                No waiver of any breach or default shall be deemed a waiver of subsequent breaches. The section headings are for reference only.
            </p>
            <p className="mb-4">
                The Services are operated in the United States, and those who access them from other locations do so at their own risk and must comply with local laws.
                These Terms are governed by the laws of the State of Delaware. The proper venue for disputes arising under these Terms will be the state and federal courts located in Delaware.
            </p>

            <h3 className="text-xl font-semibold mt-4">11.8 How to Contact Us</h3>
            <p className="mb-4">
                You may contact us regarding the Services or these Terms by email at
                <a href="mailto:legal@wildcardalliance.com" className="text-blue-500 underline"> legal@wildcardalliance.com</a>.
            </p>
        </div>


    </div>
);

export default TermsOfService;



export const getServerSideProps: GetServerSideProps = async () => {
    return { props: {} };
};
