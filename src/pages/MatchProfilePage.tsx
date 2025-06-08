import React from 'react';
import { useParams } from 'react-router-dom';
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

export const MatchProfilePage: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  
  return (
    <Container>
      <Card>
        <h1>💕 Your Match</h1>
        <p>Match ID: {matchId}</p>
        <p>Coming soon: View matched user's profile, photos, and questionnaire answers</p>
        <a href="/test">← Back to Test Page</a>
      </Card>
    </Container>
  );
}; 