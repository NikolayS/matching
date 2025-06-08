import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { NotificationService } from '../utils/notificationService';
import { NotificationPreferences } from '../types';

const Container = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  margin: 0 auto;
`;

const Title = styled.h2`
  color: #333;
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 20px 0;
  text-align: center;
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  color: #333;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
`;

const ToggleItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ToggleLabel = styled.div`
  flex: 1;
`;

const ToggleName = styled.div`
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
`;

const ToggleDescription = styled.div`
  color: #666;
  font-size: 14px;
`;

const Toggle = styled.input`
  width: 44px;
  height: 24px;
  appearance: none;
  background: #e1e5e9;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  outline: none;
  transition: all 0.2s;

  &:checked {
    background: #667eea;
  }

  &::before {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    top: 2px;
    left: 2px;
    transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  &:checked::before {
    transform: translateX(20px);
  }
`;

const TimeSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 16px;
`;

const TimeInput = styled.div`
  display: flex;
  flex-direction: column;
`;

const TimeLabel = styled.label`
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
`;

const TimeField = styled.input`
  padding: 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  color: #333;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const SaveButton = styled.button`
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const Message = styled.div<{ type: 'success' | 'error' }>`
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  text-align: center;
  font-weight: 500;
  
  ${props => props.type === 'success' ? `
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  ` : `
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  `}
`;

interface Props {
  onClose?: () => void;
}

export const NotificationSettings: React.FC<Props> = ({ onClose }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load preferences on component mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;
      
      setLoading(true);
      const prefs = await NotificationService.getUserPreferences(user.id);
      setPreferences(prefs);
      setLoading(false);
    };

    loadPreferences();
  }, [user]);

  const handleToggleChange = (field: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      [field]: value
    });
  };

  const handleTimeChange = (field: 'quiet_hours_start' | 'quiet_hours_end', value: string) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      [field]: value
    });
  };

  const handleSave = async () => {
    if (!user || !preferences) return;

    setSaving(true);
    setMessage(null);

    try {
      const success = await NotificationService.updateUserPreferences(user.id, preferences);
      
      if (success) {
        setMessage({ type: 'success', text: 'Notification preferences saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Failed to save preferences. Please try again.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Title>Loading preferences...</Title>
      </Container>
    );
  }

  if (!preferences) {
    return (
      <Container>
        <Title>Error loading preferences</Title>
      </Container>
    );
  }

  return (
    <Container>
      <Title>📱 Notification Settings</Title>
      
      {message && (
        <Message type={message.type}>
          {message.text}
        </Message>
      )}

      <Section>
        <SectionTitle>SMS Notifications</SectionTitle>
        <ToggleItem>
          <ToggleLabel>
            <ToggleName>Enable SMS Notifications</ToggleName>
            <ToggleDescription>Receive text messages for app notifications</ToggleDescription>
          </ToggleLabel>
          <Toggle
            type="checkbox"
            checked={preferences.sms_notifications}
            onChange={(e) => handleToggleChange('sms_notifications', e.target.checked)}
          />
        </ToggleItem>
      </Section>

      {preferences.sms_notifications && (
        <>
          <Section>
            <SectionTitle>Notification Types</SectionTitle>
            
            <ToggleItem>
              <ToggleLabel>
                <ToggleName>New Matches</ToggleName>
                <ToggleDescription>Get notified when someone matches with you</ToggleDescription>
              </ToggleLabel>
              <Toggle
                type="checkbox"
                checked={preferences.new_matches}
                onChange={(e) => handleToggleChange('new_matches', e.target.checked)}
              />
            </ToggleItem>

            <ToggleItem>
              <ToggleLabel>
                <ToggleName>Profile Views</ToggleName>
                <ToggleDescription>Get notified when someone views your profile</ToggleDescription>
              </ToggleLabel>
              <Toggle
                type="checkbox"
                checked={preferences.profile_views}
                onChange={(e) => handleToggleChange('profile_views', e.target.checked)}
              />
            </ToggleItem>

            <ToggleItem>
              <ToggleLabel>
                <ToggleName>Messages</ToggleName>
                <ToggleDescription>Get notified when you receive new messages</ToggleDescription>
              </ToggleLabel>
              <Toggle
                type="checkbox"
                checked={preferences.messages}
                onChange={(e) => handleToggleChange('messages', e.target.checked)}
              />
            </ToggleItem>

            <ToggleItem>
              <ToggleLabel>
                <ToggleName>Activity Reminders</ToggleName>
                <ToggleDescription>Gentle reminders to check the app</ToggleDescription>
              </ToggleLabel>
              <Toggle
                type="checkbox"
                checked={preferences.activity_reminders}
                onChange={(e) => handleToggleChange('activity_reminders', e.target.checked)}
              />
            </ToggleItem>
          </Section>

          <Section>
            <SectionTitle>Quiet Hours</SectionTitle>
            <ToggleDescription style={{ marginBottom: '16px', color: '#666' }}>
              Set times when you don't want to receive notifications
            </ToggleDescription>
            
            <TimeSection>
              <TimeInput>
                <TimeLabel>Start Time</TimeLabel>
                <TimeField
                  type="time"
                  value={preferences.quiet_hours_start || '22:00'}
                  onChange={(e) => handleTimeChange('quiet_hours_start', e.target.value)}
                />
              </TimeInput>
              
              <TimeInput>
                <TimeLabel>End Time</TimeLabel>
                <TimeField
                  type="time"
                  value={preferences.quiet_hours_end || '08:00'}
                  onChange={(e) => handleTimeChange('quiet_hours_end', e.target.value)}
                />
              </TimeInput>
            </TimeSection>
          </Section>
        </>
      )}

      <SaveButton onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Preferences'}
      </SaveButton>
    </Container>
  );
}; 