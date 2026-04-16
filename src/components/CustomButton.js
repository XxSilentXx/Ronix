import styled from 'styled-components';

const CustomButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: ${props => props.$secondary ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)'};
  color: #fff;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-family: 'Barlow', 'Luckiest Guy', sans-serif;
  font-weight: 700;
  font-size: 1.1rem;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.$disabled ? 0.7 : 1};
  transition: all 0.2s cubic-bezier(.25,1.7,.45,.87), box-shadow 0.2s cubic-bezier(.25,1.7,.45,.87);
  box-shadow: 0 0 12px #4facfe55;
  border: 2px solid transparent;
  text-shadow: 0 2px 8px #2b1055cc;
  &:hover {
    transform: ${props => props.$disabled ? 'none' : 'translateY(-2px) scale(1.04)'};
    box-shadow: 0 0 32px #ff61e6cc, 0 0 64px #00f2fe99;
    border: 2px solid #ff61e6;
    background: linear-gradient(90deg, #ff61e6 0%, #4facfe 100%);
  }
  &:active {
    transform: scale(0.97);
    box-shadow: 0 0 8px #4facfe99;
  }
  & .icon {
    display: flex;
    align-items: center;
    font-size: 1.3em;
  }
`;

export default CustomButton; 