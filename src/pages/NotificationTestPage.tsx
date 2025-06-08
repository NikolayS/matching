import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { NotificationTester } from '../utils/testNotifications';
import { NotificationSettings } from '../components/NotificationSettings';

const Container = styled.div`
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const Content = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const Card = styled.div`
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
`;

const Title = styled.h1`
  color: #333;
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 20px 0;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Description = styled.p`
  color: #666;
  font-size: 16px;
  text-align: center;
  margin-bottom: 40px;
  line-height: 1.6;
`;

const TestSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
`;

const TestCard = styled.div`
  background: #f8f9ff;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  border: 2px solid transparent;
  transition: all 0.2s;

  &:hover {
    border-color: #667eea;
    transform: translateY(-4px);
  }
`;

const TestIcon = styled.div`
  font-size: 32px;
  margin-bottom: 16px;
`;

const TestTitle = styled.h3`
  color: #333;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const TestDescription = styled.p`
  color: #666;
  font-size: 14px;
  margin: 0 0 20px 0;
  line-height: 1.4;
`;

const TestButton = styled.button<{ testing?: boolean }>`
  width: 100%;
  padding: 12px 20px;
  background: ${props => props.testing ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: ${props => props.testing ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;

  &:hover {
    ${props => !props.testing && `
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
    `}
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const AllTestsButton = styled.button<{ testing?: boolean }>`
  width: 100%;
  padding: 16px;
  background: ${props => props.testing ? '#ccc' : 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'};
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: ${props => props.testing ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  margin-bottom: 30px;

  &:hover {
    ${props => !props.testing && `
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(231, 76, 60, 0.3);
    `}
  }
`;

const ResultsSection = styled.div`
  margin-top: 30px;
`;

const ResultItem = styled.div<{ success?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 8px;
  background: ${props => props.success ? '#d4edda' : '#f8d7da'};
  color: ${props => props.success ? '#155724' : '#721c24'};
  border: 1px solid ${props => props.success ? '#c3e6cb' : '#f5c6cb'};
`;

const PhoneInfo = styled.div`
  background: #e8f4fd;
  border: 2px solid #b3d9f7;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 30px;
  text-align: center;
`;

const PhoneNumber = styled.div`
  color: #1a73e8;
  font-size: 18px;
  font-weight: 600;
`;

const BackButton = styled.button`
  background: transparent;
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 20px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.5);
  }
`;

interface TestResult {
  type: string;
  success: boolean;
  timestamp: Date;
}

export const NotificationTestPage: React.FC = () => {
  const { user } = useAuth();
  const [testing, setTesting] = useState<string | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  const addResult = (type: string, success: boolean) => {
    setResults(prev => [...prev, { type, success, timestamp: new Date() }]);
  };

  const runTest = async (testType: string, testFunction: () => Promise<boolean>) => {
    setTesting(testType);
    try {
      const success = await testFunction();
      addResult(testType, success);
    } catch (error) {
      console.error('Test error:', error);
      addResult(testType, false);
    } finally {
      setTesting(null);
    }
  };

  const runAllTests = async () => {
    setTesting('all');
    try {
      const userId = isDemo ? 'demo-user' : user.id;
      const { passed, total } = await NotificationTester.runAllTests(userId);
      addResult(`All Tests (${passed}/${total} passed)`, passed === total);
    } catch (error) {
      console.error('All tests error:', error);
      addResult('All Tests', false);
    } finally {
      setTesting(null);
    }
  };

  // Demo mode when no user is authenticated
  const demoPhone = '(650) 441-6163';
  const isDemo = !user;

  if (showSettings) {
    return (
      <Container>
        <Content>
          <BackButton onClick={() => setShowSettings(false)}>
            ← Back to Tests
          </BackButton>
          <NotificationSettings />
        </Content>
      </Container>
    );
  }

  return (
    <Container>
      <Content>
        <Card>
          <Title>📱 SMS Notification Tester</Title>
          <Description>
            Test your SMS notification system! Make sure you have notification preferences enabled.
            Each test will send a real SMS to your phone number.
          </Description>

          <PhoneInfo>
            <div style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>
              SMS will be sent to:
            </div>
            <PhoneNumber>{isDemo ? demoPhone : user.phone_number}</PhoneNumber>
            {isDemo && (
              <div style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
                Demo mode - using test phone number
              </div>
            )}
          </PhoneInfo>

          <TestButton 
            onClick={() => setShowSettings(true)}
            style={{ marginBottom: '30px', background: '#6c757d' }}
          >
            ⚙️ Manage Notification Settings
          </TestButton>

          <AllTestsButton 
            onClick={runAllTests}
            testing={testing === 'all'}
            disabled={testing !== null}
          >
            {testing === 'all' ? '🧪 Running All Tests...' : '🚀 Run All Tests (4 SMS messages)'}
          </AllTestsButton>

          <TestSection>
            <TestCard>
              <TestIcon>🎉</TestIcon>
              <TestTitle>New Match</TestTitle>
              <TestDescription>
                Test the notification sent when someone matches with you
              </TestDescription>
              <TestButton
                onClick={() => runTest('Match Notification', () => NotificationTester.testMatchNotification(isDemo ? 'demo-user' : user.id))}
                testing={testing === 'Match Notification'}
                disabled={testing !== null}
              >
                {testing === 'Match Notification' ? 'Sending...' : 'Test Match SMS'}
              </TestButton>
            </TestCard>

            <TestCard>
              <TestIcon>👀</TestIcon>
              <TestTitle>Profile View</TestTitle>
              <TestDescription>
                Test the notification sent when someone views your profile
              </TestDescription>
              <TestButton
                onClick={() => runTest('Profile View', () => NotificationTester.testProfileViewNotification(isDemo ? 'demo-user' : user.id))}
                testing={testing === 'Profile View'}
                disabled={testing !== null}
              >
                {testing === 'Profile View' ? 'Sending...' : 'Test Profile View SMS'}
              </TestButton>
            </TestCard>

            <TestCard>
              <TestIcon>💬</TestIcon>
              <TestTitle>New Message</TestTitle>
              <TestDescription>
                Test the notification sent when you receive a new message
              </TestDescription>
              <TestButton
                onClick={() => runTest('Message Notification', () => NotificationTester.testMessageNotification(isDemo ? 'demo-user' : user.id))}
                testing={testing === 'Message Notification'}
                disabled={testing !== null}
              >
                {testing === 'Message Notification' ? 'Sending...' : 'Test Message SMS'}
              </TestButton>
            </TestCard>

            <TestCard>
              <TestIcon>✨</TestIcon>
              <TestTitle>Activity Reminder</TestTitle>
              <TestDescription>
                Test the gentle reminder notification for inactive users
              </TestDescription>
              <TestButton
                onClick={() => runTest('Activity Reminder', () => NotificationTester.testActivityReminder(isDemo ? 'demo-user' : user.id))}
                testing={testing === 'Activity Reminder'}
                disabled={testing !== null}
              >
                {testing === 'Activity Reminder' ? 'Sending...' : 'Test Reminder SMS'}
              </TestButton>
            </TestCard>
          </TestSection>

          {results.length > 0 && (
            <ResultsSection>
              <h3 style={{ color: '#333', marginBottom: '16px' }}>📊 Test Results:</h3>
              {results.map((result, index) => (
                <ResultItem key={index} success={result.success}>
                  <div>{result.success ? '✅' : '❌'}</div>
                  <div>
                    <strong>{result.type}</strong> - {result.timestamp.toLocaleTimeString()}
                  </div>
                </ResultItem>
              ))}
            </ResultsSection>
          )}
        </Card>
      </Content>
    </Container>
  );
}; 