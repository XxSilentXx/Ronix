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

const SubList = styled.ol`
  padding-left: 1.5rem;
  margin: 0.5rem 0;
  
  li {
    margin-bottom: 0.5rem;
    line-height: 1.5;
  }
`;

const TermsOfService = () => {
  return (
    <Container>
      <Title>Terms of Service</Title>
      <LastModified>Last modified: June 15, 2024</LastModified>
      
      <Section>
        <SectionTitle>1. ACCEPTING THESE TERMS</SectionTitle>
        <List>
          <li>
            This document, our rules, policies, and the other documents referenced make up our Terms of Service ("Terms"). 
            The Terms are a legally binding contract between you and our company. This contract sets out your rights and 
            responsibilities when you use our website. Please read them carefully.
          </li>
        </List>
      </Section>
      
      <Section>
        <SectionTitle>2. Changes</SectionTitle>
        <List>
          <li>
            We may amend the Terms at any time by posting a revised version on our website without prior notice. 
            The revised version will be effective at the time we post it. Following any change to the Terms, 
            a notification will be provided as notice upon visitation to the website.
          </li>
        </List>
      </Section>
      
      <Section>
        <SectionTitle>3. ACCESS</SectionTitle>
        <List>
          <li>
            You are granted a non-exclusive, limited, and revocable license to access the website and use its functionality on the condition that:
            <SubList>
              <li>You are over the age of 18;</li>
              <li>You are able to give consent to use of digital data in your jurisdiction;</li>
              <li>You only use the website for lawful purposes;</li>
              <li>You can agree to these terms at all times;</li>
              <li>You do not engage in any improper, indecent or offensive behavior while using the website; and</li>
              <li>You are not breaking any law in your relevant jurisdiction by accessing this website.</li>
            </SubList>
          </li>
          <li>
            We have developed additional software called the "Anti-Cheat" in order to ensure the integrity of all matches and competitions. 
            This software is not requested to be installed on any user by default. However, if a user is suspected of cheating, exploiting, 
            or otherwise violating the integrity of the platform as defined in these terms, we reserve the right to enforce installation 
            of the anti-cheat. In the event of a refusal of the installation, we can and will immediately suspend and terminate the account 
            of the refuser. Disclosure of the Anti-cheat's operations is confidential to prevent bad actors from negating its purpose. 
            We hold ourselves to a high standard when it comes to user security and will exclusively use findings and declarations made 
            by the anti-cheat to ensure the integrity of the platform.
          </li>
        </List>
      </Section>
      
      <Section>
        <SectionTitle>4. YOUR DETAILS AND VISITS TO THIS WEBSITE</SectionTitle>
        <List>
          <li>
            When you use this website, you agree to the processing of the information and details and you state that all information 
            and details provided are true and correspond to reality.
          </li>
        </List>
      </Section>
      
      <Section>
        <SectionTitle>5. PROHIBITED USES</SectionTitle>
        <Paragraph>
          You may not use, or encourage, promote, facilitate, instruct, or induce others to use, the website or website services 
          for any activities that violate any law, statute, ordinance, or regulation; For any other illegal or fraudulent purpose or 
          any purpose that is harmful to others; or to transmit, store, display, distribute or otherwise make available content that 
          is illegal, fraudulent, or harmful to others.
        </Paragraph>
        <List>
          <li>
            Selling or trading virtual coins or any digital assets for real-world currency or any form of compensation is strictly prohibited. 
            Any violation of this rule will result in immediate account suspension or termination without notice.
          </li>
        </List>
      </Section>
      
      <Section>
        <SectionTitle>6. SECURITY</SectionTitle>
        <Paragraph>
          We ensure the protection and honesty of the data we gather by:
        </Paragraph>
        <List>
          <li>Utilizing appropriate administrative protocols</li>
          <li>Technical safeguards</li>
          <li>Physical security controls designed to limit access</li>
          <li>Identifying and preventing unauthorized access</li>
          <li>Preventing inappropriate disclosure, modifications, and destruction of the data under our influence</li>
        </List>
      </Section>
      
      <Section>
        <SectionTitle>7. Conditions of Participation</SectionTitle>
        <List>
          <li>
            The prerequisite for using the gaming platform is registering with us. Registration is free of charge. 
            Multiple registrations by one game participant are not permitted.
          </li>
          <li>
            In order to register, the player must complete a registration form. The player chooses a method promoted by the website 
            to sign up with. The player must provide the data requested in the registration form completely and correctly. 
            It is prohibited to register using extraneous or otherwise inaccurate information. It is prohibited to register on behalf 
            of someone else. We shall confirm receipt of the details submitted with the registration by sending an e-mail to the 
            e-mail address provided by the player during registration.
          </li>
          <li>
            If the player subsequently wishes to participate in games with monetary stakes, they must deposit means of payment and 
            corresponding payment data in the further course.
          </li>
          <li>
            There is no entitlement to the conclusion of a contract of use. We can reject a registration without giving reasons. 
            In this case, we will delete the transmitted data immediately.
          </li>
          <li>
            If the player subsequently wishes to participate in games with monetary stakes, they must be over the age of 18 and they must 
            ensure that this is allowed and not prohibited under their jurisdiction. In the event of a violation of this, we reserve the 
            right to terminate the player's account/data.
          </li>
          <li>
            Any player may be blocked from the gaming platform by us for good cause or no cause. We reserve the right to; effective immediately, 
            terminate any one account at any time without prior notice. No refunds for purchases of virtual currency or other digital goods 
            will be granted under any circumstances. Under this pretence any restricted account will have their funds withheld.
          </li>
          <li>
            If the player is required by their jurisdiction to provide additional information for the purposes of participation, claiming prizes, 
            or competing in games of skill, they must inform us via reasonable channels. Appropriate channels can be deemed, in particular, 
            to be the submission of a "ticket" or "request" in the support Discord server or via email. Once we have been informed and verified 
            the information, the player may now use the platform under the regulations and conditions provided by the player's jurisdiction. 
            Should the player not communicate with us or provide the necessary information, we are not responsible for the player's actions 
            on the platform. We will, at the knowledge of such violation, banish the player's access to the platform. It is the responsibility 
            of the player to ensure that partaking in any activities on the platform are lawful in their jurisdiction and we shall not be held 
            responsible for a user's unlawful access to the website under this pretence.
          </li>
        </List>
      </Section>
      
      <Section>
        <SectionTitle>8. Performance of Games of Skill</SectionTitle>
        <List>
          <li>
            The skill level of a player can be determined on a game-by-game basis. It increases and decreases depending on the success 
            of the participant in previous participations in the specific game. Players can gauge other players' skill by looking at their 
            public profile and check who is competing at the moment by visiting the "active matches" page.
          </li>
          <li>
            In real-time games, a maximum of the number of participants specified in the game announcement will participate at the same time. 
            In the case of certain real-time games, the game will not start until a sufficient number of players have registered for the game. 
            The required number of players is specified in the game announcement. This is indicated to the player by the number of players 
            required and the number of players already registered. Up to the start of the game, the player can revoke their participation in the 
            real-time game at any time. Once the required number of players has been found, the game starts automatically, which is indicated 
            by information on the screen and the transfer of the stake required for money games. The winner of the game is the player who has 
            won the game according to the given game rules. After the end of the game, the winner is notified directly in the game about the 
            outcome of the game and a possible prize.
          </li>
          <li>
            By participating in a game for which a fee is charged, the participants in the game make mutual declarations of intent by which a gaming 
            contract is concluded. We are the receiving agent for these declarations of intent of the respective other players. When the number of 
            participants required by the game announcement has been reached, a game contract has been concluded between all participants. According 
            to the concluded game contract, the winner of the game is the one who has achieved the best result according to the game rules specified 
            by us. In the case of a tie in points, the winner is the one who has presented the corresponding score or has been better in other 
            provable game contents. This is described as the "challenge principle". In case of doubt, we have the right to act as referee to 
            determine the winner.
          </li>
          <li>
            If - for example, due to a malfunction - the match is not completed in accordance with the rules, the match shall be deemed not to 
            have taken place. We reserve the right to suspend, cancel or postpone the game in whole or in part without prior notice. This applies 
            if the game cannot be played as scheduled for reasons unforeseeable by us and beyond our control. Such circumstances include, but are 
            not limited to, hardware or software failure, the occurrence of a computer virus or program error, unauthorized third-party intervention, 
            and mechanical, technical, or legal problems beyond our control and influence. In such cases, players will be refunded any stakes paid. 
            If the cancellation of the game is due to the culpable violation of rules by a game participant, we expressly reserve the right to assert 
            claims, in particular claims for damages. We cannot accept any responsibility for the processing of such personal data by third parties.
          </li>
        </List>
      </Section>
      
      <Section>
        <SectionTitle>9. Participation Fees and Prizes</SectionTitle>
        <List>
          <li>
            If a participation fee is stated for a match in the invitation to tender, this will be debited from the virtual stake account of 
            the match participant after the player has registered.
          </li>
          <li>
            Unless otherwise stated in the game announcement, the winner of a fee-based game receives 90% of the entry fees paid by the entirety 
            of the participating game participants as winnings. 10% of the entry fees shall be paid to us as a handling fee for the organization 
            and processing of the game.
          </li>
          <li>
            An attempt will be made to credit the winnings to the player's virtual wallet account immediately after the result has been determined. 
            If this is not possible directly for technical reasons, the credit will be carried out again and the winnings will be credited within 
            24 hours at the latest.
          </li>
        </List>
      </Section>
      
      <Section>
        <SectionTitle>10. General Obligations of the Players</SectionTitle>
        <List>
          <li>
            Multiple registrations are not permitted.
          </li>
          <li>
            The password for the access-protected area of our website must be kept strictly secret by the player and changed at regular intervals 
            (every four weeks at the latest). If the player violates these duties of care and an unauthorized third party makes dispositions based 
            on knowledge of the required password, the player shall be liable for any unauthorized use of their password made possible by their conduct 
            and the associated use of the gaming platform. As soon as the player becomes aware that their password has become accessible to third parties, 
            they are obliged to change their password immediately. If this is not possible, we must be informed immediately.
          </li>
          <li>
            The aforementioned also applies to the transfer of access data to a third party. Passing on access data is generally not permitted and 
            can lead to the blocking of the entire player account.
          </li>
          <li>
            Any change in the personal data of the player (in particular the account details, address, and e-mail address) must be reported immediately 
            on the personal settings page.
          </li>
        </List>
      </Section>
      
      <Section>
        <SectionTitle>11. ENTIRE AGREEMENT</SectionTitle>
        <Paragraph>
          This Agreement contains the entire agreement and understanding among the parties hereto with respect to the subject matter hereof, 
          and supersedes all prior and contemporaneous agreements, understandings, inducements and conditions, express or implied, oral or written, 
          of any nature whatsoever with respect to the subject matter hereof.
        </Paragraph>
      </Section>
    </Container>
  );
};

export default TermsOfService; 