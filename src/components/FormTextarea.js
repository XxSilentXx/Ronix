import styled, { css } from 'styled-components';

const TextareaWrapper = styled.div`
  position: relative;
  margin-bottom: 1.5rem;
`;

const StyledTextarea = styled.textarea`
  width: 100%;
  padding: 1.1rem 1rem 1.1rem 1.2rem;
  border-radius: 10px;
  border: 2px solid #4facfe55;
  background: rgba(44, 62, 80, 0.85);
  color: #fff;
  font-family: 'Inter', Arial, sans-serif;
  font-size: 1.1rem;
  outline: none;
  transition: border 0.18s cubic-bezier(.25,1.7,.45,.87), box-shadow 0.18s cubic-bezier(.25,1.7,.45,.87);
  box-shadow: 0 2px 12px #4facfe22;
  min-height: 120px;
  resize: vertical;
  &:focus {
    border: 2px solid #ff61e6;
    box-shadow: 0 0 24px #ff61e6cc, 0 0 48px #00f2fe99;
    background: rgba(44, 62, 80, 0.95);
  }
  &:not(:placeholder-shown) + label,
  &:focus + label {
    top: -0.8rem;
    left: 1rem;
    font-size: 0.95rem;
    color: #ff61e6;
    background: #2b1055;
    padding: 0 0.4rem;
    border-radius: 6px;
    z-index: 2;
  }
  ${props => props.$error && css`
    border: 2px solid #ff5252;
    box-shadow: 0 0 16px #ff5252cc;
  `}
  ${props => props.$success && css`
    border: 2px solid #00e676;
    box-shadow: 0 0 16px #00e676cc;
  `}
`;

const FloatingLabel = styled.label`
  position: absolute;
  top: 1.1rem;
  left: 1.2rem;
  color: #b8c1ec;
  font-size: 1.1rem;
  pointer-events: none;
  transition: all 0.18s cubic-bezier(.25,1.7,.45,.87);
  background: transparent;
  z-index: 1;
`;

export { TextareaWrapper, StyledTextarea, FloatingLabel }; 