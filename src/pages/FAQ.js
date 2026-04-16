import React, { useState } from 'react';
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

const Subtitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 2rem;
  color: #b8c1ec;
  text-align: center;
`;

const FAQSection = styled.div`
  margin-bottom: 3rem;
`;

const FAQItem = styled.div`
  margin-bottom: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Question = styled.div`
  padding: 1.2rem;
  background: rgba(255, 255, 255, 0.08);
  font-weight: 600;
  font-size: 1.1rem;
  color: #4facfe;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }
`;

const Answer = styled.div`
  padding: 0;
  max-height: 0;
  overflow: hidden;
  transition: all 0.3s ease;
  line-height: 1.6;
  
  ${({ isOpen }) => isOpen && `
    padding: 1.2rem;
    max-height: 1000px;
  `}
  
  p {
    margin-bottom: 1rem;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  a {
    color: #4facfe;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const Icon = styled.span`
  transition: transform 0.3s ease;
  
  ${({ isOpen }) => isOpen && `
    transform: rotate(180deg);
  `}
`;

const FAQ = () => {
  const [openItems, setOpenItems] = useState({});
  
  const toggleItem = (id) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  const faqItems = [
    {
      id: 1,
      question: "What is our platform?",
      answer: (
        <>
          <p>
            Our platform is a competitive gaming matchmaking platform that provides users with a way of finding 
            entry-fee based games of skill for Fortnite. Players can compete in competitive matches to test their skills 
            and earn tokens.
          </p>
          <p>
            You can learn more about us in our Discord server.
          </p>
        </>
      )
    },

    {
      id: 3,
      question: "Is Skill Gaming Legal?",
      answer: (
        <>
          <p>
            Skill Games are in fact legal! Because game of skill based matches are based on skill and not on chance 
            or luck, they are NOT a form of gambling. However, you must be 18 years or older to compete in game of 
            skill based matches.
          </p>
        </>
      )
    },
    {
      id: 4,
      question: "Is my information going to be safe on our platform?",
      answer: (
        <>
          <p>
            Yes! All transactions are encrypted and handled through trusted payment providers that comply with PCI-DSS 
            standards. Other than your payment email or payment information you submit/is tied to your payment method, 
            we have no access to any of your personal payment credentials.
          </p>
          <p>
            We also do not store any passwords, and the only way to register on our platform is by using other accounts 
            that you own from other platforms such as Google, Twitch, Discord, etc.
          </p>
        </>
      )
    },
    {
      id: 5,
      question: "How do the fees work?",
      answer: (
        <>
          <p>
            We take 5% of each player's entry fee at the end of the game. By doing this, we can keep updating this platform and 
            make it the best experience for you, the user!
          </p>
          <p>
            Other than our matches, we also take fees on withdraws to cover the fee that payment processors charge us, 
            and we take a small 3% fee on any Tip transaction.
          </p>
        </>
      )
    },
    {
      id: 6,
      question: "How long does it take to receive a withdraw?",
      answer: (
        <>
          <p>
          Ronix tries to process withdrawls as fast as possible. Most withdrawl request will be reviewed and processed within 24 hours upon being recieved, but can take up to 3 business days. If you do not recieve your withdrawl within 3 business days, contact support within out Discord by making a ticket.
          </p>
        </>
      )
    },
    {
      id: 7,
      question: "Am I allowed to have more than one account?",
      answer: (
        <>
          <p>
            You are NOT allowed to have more than one account. If we notice this activity happening you will be 
            indefinitely banned from using our products or services. This includes logging into other people's accounts 
            or playing on behalf of other people by logging into the linked accounts.
          </p>
        </>
      )
    },
    {
      id: 9,
      question: "What are tickets?",
      answer: (
        <>
          <p>
            Tickets are how our staff communicate with users to help with disputed matches, clarification of rules, 
            reporting a player, and general inquiries regarding the website. By opening a ticket, you will receive 
            direct access to our support and moderation team to assist with your issues.
          </p>
        </>
      )
    },
    {
      id: 10,
      question: "How can I create a ticket or get help in a match?",
      answer: (
        <>
          <p>
            To open a ticket, join our Discord and find the channel #open-a-ticket. Once created, you will provide staff 
            with an explanation of your issue, and how they can help. After this, a staff member will join the ticket to 
            resolve the problem as quickly as possible. You can join our Discord server by clicking the Discord icon in 
            the footer of our website.
          </p>
        </>
      )
    },
    {
      id: 11,
      question: "Why can't I see my Discord avatar?",
      answer: (
        <>
          <p>
            If your Discord avatar isn't showing correctly, you can try the "Refresh Avatars" button on the Friends page.
            If the issue persists, it might be related to your browser cache. Try clearing your browser cache or using the
            refresh button again after a few minutes.
          </p>
        </>
      )
    },
    {
      id: 12,
      question: "Can I use the same display name as someone else?",
      answer: (
        <>
          <p>
            No, our system prevents duplicate display names to ensure everyone has a unique identity. If you try to use 
            a display name that's already taken, you'll be prompted to choose a different one. This helps maintain fair
            identification for all users on our platform.
          </p>
        </>
      )
    }
  ];
  
  return (
    <Container>
      <Title>Frequently Asked Questions</Title>
      <Subtitle>Find answers to commonly asked questions about our platform</Subtitle>
      
      <FAQSection>
        {faqItems.map((item) => (
          <FAQItem key={item.id}>
            <Question onClick={() => toggleItem(item.id)}>
              {item.question}
              <Icon isOpen={openItems[item.id]}>
                <svg 
                  width="14" 
                  height="8" 
                  viewBox="0 0 14 8" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M1 1L7 7L13 1" 
                    stroke="#4facfe" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </Icon>
            </Question>
            <Answer isOpen={openItems[item.id]}>
              {item.answer}
            </Answer>
          </FAQItem>
        ))}
      </FAQSection>
    </Container>
  );
};

export default FAQ; 