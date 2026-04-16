import styled from 'styled-components';

const Card = styled.div`
  background: var(--color-bg-card, rgba(44, 62, 80, 0.85));
  border-radius: 18px;
  box-shadow: 0 8px 32px #4facfe33, 0 1.5px 8px #2b105555;
  border: 2px solid #4facfe55;
  padding: 2rem 1.5rem;
  color: var(--color-text-main, #fff);
  font-family: 'Barlow', 'Luckiest Guy', sans-serif;
  font-size: 1.1rem;
  position: relative;
  overflow: hidden;
  transition: transform 0.18s cubic-bezier(.25,1.7,.45,.87), box-shadow 0.18s cubic-bezier(.25,1.7,.45,.87);
  backdrop-filter: blur(8px);
  &:hover, &:focus {
    transform: translateY(-8px) scale(1.03) rotate(-1deg);
    box-shadow: 0 0 48px #ff61e6cc, 0 0 96px #00f2fe99;
    border: 2px solid #ff61e6;
    z-index: 2;
  }
`;

export default Card; 