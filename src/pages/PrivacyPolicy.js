import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #4facfe;
  text-align: center;
`;

const LastModified = styled.p`
  font-size: 0.9rem;
  color: #b8c1ec;
  margin-bottom: 2rem;
  text-align: center;
`;

const Section = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.8rem;
  color: #4facfe;
  margin-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.5rem;
`;

const Paragraph = styled.p`
  line-height: 1.6;
  margin-bottom: 1rem;
`;

const List = styled.ol`
  padding-left: 1.5rem;
  margin-bottom: 1.5rem;
  
  li {
    margin-bottom: 0.8rem;
    line-height: 1.6;
  }
`;

const SubList = styled.ul`
  padding-left: 1.5rem;
  margin: 0.5rem 0;
  list-style-type: disc;
  
  li {
    margin-bottom: 0.5rem;
    line-height: 1.5;
  }
`;

const PrivacyPolicy = () => {
  return (
    <Container>
      <Title>Privacy Policy</Title>
      <LastModified>Last modified: June 15, 2024</LastModified>
      
      <Section>
        <SectionTitle>1. General Information and Principles of Data Processing</SectionTitle>
        <Paragraph>
          We are pleased that you are visiting our website. The protection of your privacy and the protection of your personal data, 
          the so-called personal data, when using our website is an important concern for us.
        </Paragraph>
        <Paragraph>
          According to Art. 4 No. 1 of the GDPR, personal data is any information relating to an identified or identifiable natural person. 
          This includes, for example, information such as your first and last name, your address, your telephone number, your e-mail address, 
          but also your IP address. Data for which no reference to your person can be established, such as through anonymisation, is not personal data. 
          Processing (e.g. collecting, storing, reading, querying, using, transmitting, deleting or destroying) according to Art. 4 No. 2 DS-GVO 
          always requires a legal basis or your consent. Processed personal data must be deleted as soon as the purpose of the processing has been 
          achieved and there are no longer any legally prescribed retention obligations to uphold. Here you will find information about the handling 
          of your personal data when visiting our website. In order to provide the functions and services of our website, it is necessary for us to 
          collect personal data about you. We also explain to you the type and scope of the respective data processing, the purpose and the corresponding 
          legal basis and the respective storage period.
        </Paragraph>
        <Paragraph>
          This data protection declaration only applies to this website. It does not apply to other websites to which we merely refer by means of a hyperlink. 
          We cannot accept any responsibility for the confidential handling of your personal data on these third-party websites, as we have no influence on 
          whether these companies comply with data protection regulations. Please inform yourself about the handling of your personal data by these companies 
          directly on these websites.
        </Paragraph>
      </Section>
      
      <Section>
        <SectionTitle>2. Responsible Body</SectionTitle>
        <Paragraph>
          Responsible for the processing of personal data on this website is our organization, as identified in our contact information.
        </Paragraph>
      </Section>
      
      <Section>
        <SectionTitle>3. Provision and Use of the Website/Server Logfiles</SectionTitle>
        <Paragraph>
          (a) The nature and extent of data processing
        </Paragraph>
        <Paragraph>
          If you use this website without transmitting data to us in any other way (e.g. by registering or using the contact form), 
          we collect technically necessary data via server log files that are automatically transmitted to our server, including:
        </Paragraph>
        <SubList>
          <li>IP address</li>
          <li>Date and time of the request</li>
          <li>Name and URL of the retrieved file</li>
          <li>Website from which the access is made (referrer URL)</li>
          <li>Access status/HTTP status code</li>
          <li>Browser type</li>
        </SubList>
        <Paragraph>
          (b) Purpose and legal basis
        </Paragraph>
        <Paragraph>
          This processing is technically necessary in order to be able to display our website to you. We also use the data to ensure the 
          security and stability of our website. The legal basis for this processing is Art. 6 (1) lit. f) DS-GVO. The processing of the 
          aforementioned data is necessary for the provision of a website and thus serves to protect a legitimate interest of our company.
        </Paragraph>
        <Paragraph>
          (c) Storage period
        </Paragraph>
        <Paragraph>
          As soon as the aforementioned personal data is no longer required to display the website, it will be deleted. The collection of the 
          data for the provision of the website and the storage of the data in log files is mandatory for the operation of the website. 
          Consequently, there is no possibility for the user to object to this aspect. Further storage may take place in individual cases if this 
          is required by law.
        </Paragraph>
      </Section>
      
      <Section>
        <SectionTitle>4. Use of Cookies</SectionTitle>
        <Paragraph>
          (a) Nature, scope and purpose of data processing
        </Paragraph>
        <Paragraph>
          We use cookies. Cookies are small files that are sent by us to the browser of your terminal device during your visit to our website and 
          stored there. Some functions of our website cannot be offered without the use of technically necessary cookies. Other cookies, on the other 
          hand, enable us to perform various analyses. For example, some cookies can recognise the browser you are using when you visit our website 
          again and transmit various information to us. We use cookies to facilitate and improve the use of our website. Among other things, cookies 
          enable us to make our website more user-friendly and effective for you by, for example, tracking your use of our website and determining 
          your preferred settings (e.g. country and language settings). If third parties process information via cookies, they collect the information 
          directly from your browser. However, cookies do not cause any damage to your end device. They cannot execute programs or contain viruses. 
          Various types of cookies are used on our website, the type and function of which are explained below.
        </Paragraph>
        <Paragraph>
          <strong>Temporary cookies/ session cookies</strong>
        </Paragraph>
        <Paragraph>
          On our website, so-called temporary cookies or session cookies are used, which are automatically deleted as soon as you close your browser. 
          This type of cookie makes it possible to record your session ID. This allows various requests from your browser to be assigned to a common 
          session and makes it possible to recognise your terminal device during subsequent visits to the website.
        </Paragraph>
        <Paragraph>
          <strong>Permanent cookies</strong>
        </Paragraph>
        <Paragraph>
          So-called permanent cookies are used on our website. Permanent cookies are cookies that are stored in your browser for a longer period of time 
          and can transmit information. The respective storage period differs depending on the cookie. You can delete permanent cookies independently via 
          your browser settings.
        </Paragraph>
        <Paragraph>
          <strong>Third-party cookies</strong>
        </Paragraph>
        <Paragraph>
          We use analytical cookies to monitor anonymised user behaviour on our website. We also use advertising cookies. These cookies allow us to track 
          user behavior for advertising and targeted marketing purposes. Social media cookies allow us to connect to your social networks and share content 
          from our website within your networks.
        </Paragraph>
        <Paragraph>
          <strong>Configuration of the browser settings</strong>
        </Paragraph>
        <Paragraph>
          Most web browsers are preset to automatically accept cookies. However, you can configure your browser so that it only accepts certain cookies or 
          not at all. However, we would like to point out that you may then no longer be able to use all the functions of our website. You can also delete 
          cookies already stored in your browser via your browser settings. Furthermore, it is possible to set your browser so that it notifies you before 
          cookies are stored. Since the various browsers can differ in their respective functions, we ask you to use the respective help menu of your browser 
          for the corresponding configuration options. Disabling the use of cookies may require the storage of a permanent cookie on your computer. If you 
          subsequently delete this cookie, you will need to deactivate it again.
        </Paragraph>
        <Paragraph>
          (b) Legal basis
        </Paragraph>
        <Paragraph>
          Based on the purposes described, the legal basis for the processing of personal data using cookies is Art. 6 (1) lit. f) DS-GVO. If you have 
          given us your consent to the use of cookies on the basis of a notice ("cookie banner") issued by us on the website, the legal basis is additionally 
          Art. 6 (1) lit. a) DS-GVO.
        </Paragraph>
        <Paragraph>
          (c) Storage period
        </Paragraph>
        <Paragraph>
          As soon as the data transmitted to us via the cookies is no longer required for the purposes described above, this information is deleted. 
          Further storage may take place in individual cases if this is required by law.
        </Paragraph>
      </Section>
      
      <Section>
        <SectionTitle>5. Data Collection for the Execution of Pre-Contractual Measures and for the Fulfilment of the Contract</SectionTitle>
        <Paragraph>
          (a) The nature and extent of data processing
        </Paragraph>
        <Paragraph>
          In the pre-contractual area and at the conclusion of the contract, we collect personal data about you. This concerns, for example, first and last name, 
          address, e-mail address, telephone number or bank details.
        </Paragraph>
        <Paragraph>
          (b) Purpose and legal basis of the data processing
        </Paragraph>
        <Paragraph>
          We collect and process this data exclusively for the purpose of executing the contract or fulfilling pre-contractual obligations. The legal basis 
          for this is Art. 6 para. 1 lit b) DS-GVO. If you have also given your consent, the additional legal basis is Art. 6 para. 1 lit. a) DS-GVO.
        </Paragraph>
        <Paragraph>
          (c) Storage period
        </Paragraph>
        <Paragraph>
          The data shall be deleted as soon as they are no longer necessary for the purpose for which they were processed. In addition, there may be legal 
          obligations to retain data, for example, obligations to retain data under commercial or tax law. If such retention obligations exist, we will block 
          or delete your data at the end of these retention obligations.
        </Paragraph>
      </Section>
      
      <Section>
        <SectionTitle>6. Registration Possibility</SectionTitle>
        <Paragraph>
          (a) The nature and extent of data processing
        </Paragraph>
        <Paragraph>
          You can register on our website. If you register, we collect and store the data you enter in the input mask (e.g. last name, first name, e-mail address). 
          This data will not be passed on to third parties.
        </Paragraph>
        <Paragraph>
          (b) Purpose and legal basis of the data processing
        </Paragraph>
        <Paragraph>
          Your registration is necessary for the use of certain content and services on our website or for the performance of a contract or for the implementation 
          of pre-contractual measures. After registration, you are free to change the personal data provided during registration at any time or to have it completely 
          deleted from the data stock of the controller. In the case of consent, the legal basis for processing is Art. 6 (1) a) DS-GVO. If your registration serves 
          to prepare the conclusion of a contract, Art. 6 (1) (b) DS-GVO is an additional legal basis.
        </Paragraph>
        <Paragraph>
          (c) Storage period
        </Paragraph>
        <Paragraph>
          The data collected during registration will be stored by us for as long as you are registered on our website and will then be deleted. Legal retention periods 
          remain unaffected.
        </Paragraph>
      </Section>
      
      <Section>
        <SectionTitle>7. Data Transmission</SectionTitle>
        <Paragraph>
          We will only share your personal information with third parties if:
        </Paragraph>
        <List>
          <li>
            you have given your express consent to this in accordance with Art. 6 (1) a) DS-GVO.
          </li>
          <li>
            this is legally permissible and necessary according to Art. 6 (1) lit. b) DS-GVO for the fulfilment of a contractual relationship with you or the 
            implementation of pre-contractual measures.
          </li>
          <li>
            there is a legal obligation for the transfer according to Art. 6 Para. 1 lit. c) DS-GVO. We are legally obliged to transmit data to state authorities, 
            e.g. tax authorities, social insurance agencies, health insurance companies, supervisory authorities and law enforcement agencies.
          </li>
          <li>
            the disclosure is necessary in accordance with Art. 6 Para. 1 lit. f) DS-GVO for the protection of legitimate company interests, as well as for the 
            assertion, exercise or defence of legal claims and there is no reason to assume that you have an overriding interest worthy of protection in the 
            non-disclosure of your data.
          </li>
          <li>
            in accordance with Art. 28 DS-GVO, we make use of external service providers, so-called order processors, who are obliged to handle your data with care. 
            We use such service providers in the areas of:
            <SubList>
              <li>IT</li>
              <li>Logistics</li>
              <li>Telecommunications</li>
            </SubList>
          </li>
        </List>
        <Paragraph>
          When transferring data to external bodies in third countries, i.e. outside the EU or the EEA, we ensure that these bodies treat your personal data 
          with the same care as within the EU or the EEA. We only transfer personal data to third countries for which the EU Commission has confirmed an adequate 
          level of protection or if we ensure the careful handling of the personal data through contractual agreements or other suitable guarantees.
        </Paragraph>
      </Section>
      
      <Section>
        <SectionTitle>8. Data Security and Backup Measures</SectionTitle>
        <Paragraph>
          We are committed to protecting your privacy and treating your personal data confidentially. To this end, we take extensive technical and organizational 
          security precautions, which are regularly reviewed and adapted to technological progress. This includes, among other things, the use of recognized encryption 
          methods (SSL or TLS). However, data disclosed unencrypted, for example, if this is done by unencrypted e-mail, can possibly be read by third parties. We have no 
          influence on this. It is the responsibility of the respective user to protect the data provided by him or her against misuse by means of encryption or in any other way.
        </Paragraph>
      </Section>
      
      <Section>
        <SectionTitle>9. Changes to the Privacy Policy</SectionTitle>
        <Paragraph>
          We reserve the right at any time to update this statement as necessary.
        </Paragraph>
      </Section>
    </Container>
  );
};

export default PrivacyPolicy; 