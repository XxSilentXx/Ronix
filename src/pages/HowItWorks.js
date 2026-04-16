import React from 'react';
import styled from 'styled-components';

const HowItWorksContainer = styled.div`
  min-height: 100vh;
  background: #131124;
  color: #fff;
  padding: 2rem;
`;

const HowItWorksHeader = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  
  h1 {
    font-size: 3rem;
    background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 800;
    margin-bottom: 1rem;
  }
  
  p {
    color: #b8c1ec;
    font-size: 1.2rem;
    max-width: 800px;
    margin: 0 auto;
  }
`;

const StepsContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const Step = styled.div`
  display: flex;
  gap: 2rem;
  align-items: flex-start;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const StepNumber = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: 700;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    margin: 0 auto;
  }
`;

const StepContent = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  flex: 1;
  
  h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #4facfe;
  }
  
  p {
    color: #b8c1ec;
    line-height: 1.6;
    margin-bottom: 1.5rem;
  }
  
  ul {
    color: #b8c1ec;
    margin-left: 1.5rem;
    
    li {
      margin-bottom: 0.5rem;
    }
  }
`;

const FAQSection = styled.div`
  max-width: 1000px;
  margin: 4rem auto 0;
`;

const FAQTitle = styled.h2`
  font-size: 2rem;
  text-align: center;
  margin-bottom: 2rem;
  color: #fff;
`;

const FAQItem = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1rem;
  
  h4 {
    font-size: 1.2rem;
    margin-bottom: 1rem;
    color: #4facfe;
  }
  
  p {
    color: #b8c1ec;
    line-height: 1.6;
  }
`;



const HowItWorks = () => {
  return (
    <HowItWorksContainer>
      <HowItWorksHeader>
        <h1>HOW IT WORKS</h1>
        <p>
          Ronix makes it easy to compete in head-to-head Fortnite matches, earn tokens, and climb the leaderboards.
          Follow these simple steps to get started.
        </p>
      </HowItWorksHeader>
      
      <StepsContainer>
        <Step>
          <StepNumber>1</StepNumber>
          <StepContent>
            <h3>Create Your Account</h3>
            <p>
              Sign up for a free account using your Google email account.
              Complete your profile by linking your Discord account and Epic Games account.
            </p>
      
          </StepContent>
        </Step>
        
        <Step>
          <StepNumber>2</StepNumber>
          <StepContent>
            <h3>Deposit Tokens</h3>
            <p>
              Add more coins to your account using our secure payment methods:
            </p>
            <ul>
              <li>Credit/Debit Card</li>
              <li>PayPal</li>
            </ul>
            <p>
              All transactions are secure and tokens are instantly added to your account.
            </p>
          </StepContent>
        </Step>
        
        <Step>
          <StepNumber>3</StepNumber>
          <StepContent>
            <h3>Create or Join a match</h3>
            <p>
              Browse available matches or create your own with custom rules:
            </p>
            <ul>
              <li>Choose game mode (1v1, 2v2, Squad)</li>
              <li>Set match amount</li>
              <li>Specify platform restrictions</li>
              <li>Select region</li>
              <li>Define victory conditions</li>
            </ul>
            <p>
              Once a match is created, other players can join until all spots are filled.
            </p>
          </StepContent>
        </Step>
        
        <Step>
          <StepNumber>4</StepNumber>
          <StepContent>
            <h3>Play Your Match</h3>
            <p>
              After all players have joined and accepted the match terms:
            </p>
            <ul>
              <li>Add each other as friends in Fortnite</li>
              <li>The host creates a private match with the agreed rules</li>
              <li>Play your match and record the results</li>
              <li>Submit screenshots or video clips as proof if required</li>
            </ul>
            <p>
              Our system will automatically track match results
            </p>
          </StepContent>
        </Step>
        
        <Step>
          <StepNumber>5</StepNumber>
          <StepContent>
            <h3>Collect Your Winnings</h3>
            <p>
              After the match is complete and results are verified:
            </p>
            <ul>
              <li>Winners receive the coins automatically</li>
              <li>Your stats and leaderboard position are updated</li>
              <li>Withdraw your coins anytime to your preferred payment method</li>
            </ul>
            <p>
              Our platform ensures fair play with a dispute resolution system in case of disagreements.
            </p>
          </StepContent>
        </Step>
      </StepsContainer>
      
      <FAQSection>
        <FAQTitle>Frequently Asked Questions</FAQTitle>
        
        <FAQItem>
          <h4>How do you prevent cheating?</h4>
          <p>
            We have several anti-cheating measures in place, including result verification, replay analysis, and a reporting system. Players found cheating will be permanently banned and forfeit all tokens in their account.
          </p>
        </FAQItem>
        
        <FAQItem>
          <h4>What happens if there's a dispute about match results?</h4>
          <p>
            Our platform has a dedicated dispute resolution team. If players disagree about match results, both parties can submit evidence (screenshots, video clips, etc.), and our team will review and make a fair decision.
          </p>
        </FAQItem>
        
        <FAQItem>
          <h4>How quickly can I withdraw my winnings?</h4>
          <p>
          Ronix tries to process withdrawls as fast as possible. Most withdrawl request will be reviewed and processed within 24 hours upon being recieved, but can take up to 3 business days. If you do not recieve your withdrawl within 3 business days, contact support within out Discord by making a ticket.
          </p>
        </FAQItem>
      </FAQSection>
    </HowItWorksContainer>
  );
};

export default HowItWorks;
