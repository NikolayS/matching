import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
`;

const Card = styled.div`
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
  text-align: center;
`;

export const MatchingPage: React.FC = () => {
  return (
    <Container>
      <Card>
        <h1>🔍 Finding Your Match...</h1>
        <p>Our AI is analyzing your profile and searching for compatible matches.</p>
        <p>We'll notify you via SMS when we find someone special!</p>
        <a href="/test">← Back to Test Page</a>
      </Card>
    </Container>
  );
}; 