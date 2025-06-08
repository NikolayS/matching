import React, { useState } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ProfileSetupForm } from '../types';
import { supabase } from '../supabaseClient';
import { PhotoUpload } from '../components/PhotoUpload';
import { Questionnaire } from '../components/Questionnaire';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const Card = styled.div`
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  color: #333;
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin: 20px 0;
`;

const StepDot = styled.div<{ active: boolean; completed: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => 
    props.completed ? '#27ae60' : 
    props.active ? '#667eea' : '#e1e5e9'
  };
  transition: all 0.2s;
`;

const StepConnector = styled.div<{ completed: boolean }>`
  width: 40px;
  height: 2px;
  background: ${props => props.completed ? '#27ae60' : '#e1e5e9'};
  transition: all 0.2s;
`;

const StepLabel = styled.div`
  color: #666;
  font-size: 14px;
  margin-top: 8px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const StepContent = styled.div`
  margin-bottom: 40px;
`;

const StepTitle = styled.h2`
  color: #333;
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const StepDescription = styled.p`
  color: #666;
  font-size: 16px;
  margin: 0 0 24px 0;
  line-height: 1.5;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 32px;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  flex: 1;
  padding: 16px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  ${props => props.variant === 'secondary' ? `
    background: transparent;
    color: #667eea;
    border: 2px solid #e1e5e9;

    &:hover {
      border-color: #667eea;
      background: #f8f9ff;
    }
  ` : `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ReviewSection = styled.div`
  background: #f8f9ff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
`;

const ReviewTitle = styled.h3`
  color: #333;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
`;

const ReviewItem = styled.div`
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ReviewLabel = styled.div`
  color: #666;
  font-size: 14px;
  font-weight: 500;
`;

const ReviewValue = styled.div`
  color: #333;
  font-size: 16px;
  margin-top: 4px;
`;

const PhotoPreview = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 12px;
  object-fit: cover;
  margin-top: 8px;
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 14px;
  margin-top: 8px;
  padding: 12px;
  background: #ffeaa7;
  border-radius: 8px;
  border-left: 4px solid #e74c3c;
`;

const LogoutButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: transparent;
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.5);
  }
`;

export const ProfileSetupPage: React.FC = () => {
  const { user, signOut, refreshProfile, updateUser } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<ProfileSetupForm>({
    defaultValues: {
      photo: null,
      questionnaire: {
        relationship_intent: undefined,
        want_children: undefined,
        social_energy: undefined,
        adventure_level: undefined,
        important_values: [],
        political_alignment: undefined,
        humor_style: undefined,
        conflict_style: undefined,
        ideal_weekend: [],
        exercise_routine: undefined
      }
    }
  });

  const watchedData = watch();

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePhotoSelect = (file: File) => {
    setValue('photo', file);
  };

  const onSubmit = async (data: ProfileSetupForm) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let photoUrl = null;

      // Upload photo if provided
      if (data.photo) {
        const fileExt = data.photo.name.split('.').pop();
        const fileName = `${user.id}/profile.${fileExt}`;

        // Ensure bucket exists (create if not)
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets?.some(bucket => bucket.name === 'profile-photos');
        
        if (!bucketExists) {
          const { error: bucketError } = await supabase.storage.createBucket('profile-photos', {
            public: true,
            allowedMimeTypes: ['image/*'],
            fileSizeLimit: '5MB'
          });
          
          if (bucketError) {
            console.warn('Could not create bucket:', bucketError.message);
          }
        }

        // For custom auth users, we'll store photos via our backend
        // Create a FormData object to send the file
        const formData = new FormData();
        formData.append('photo', data.photo);
        formData.append('userId', user.id);

        try {
          const functionsUrl = process.env.REACT_APP_SUPABASE_FUNCTIONS_URL || 'https://zekigaxnilsrennylvnw.supabase.co/functions/v1';
          
          const uploadResponse = await fetch(`${functionsUrl}/upload-photo`, {
            method: 'POST',
            body: formData,
            headers: {
              'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            }
          });

          const uploadResult = await uploadResponse.json();
          
          if (!uploadResult.success) {
            throw new Error(uploadResult.error || 'Photo upload failed');
          }

          photoUrl = uploadResult.photoUrl;
        } catch (fetchError) {
          // Fallback to direct Supabase upload (for email auth users)
          console.log('Trying direct Supabase upload as fallback...');
          
          const { error: uploadError } = await supabase.storage
            .from('profile-photos')
            .upload(fileName, data.photo, { 
              upsert: true 
            });

          if (uploadError) {
            throw new Error(`Photo upload failed: ${uploadError.message}`);
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('profile-photos')
            .getPublicUrl(fileName);

          photoUrl = publicUrl;
        }
      }

      // Check if user is custom auth (phone) or email auth
      // Custom auth users have sessionToken in localStorage
      const isCustomAuth = !!localStorage.getItem('sessionToken');
      
      if (isCustomAuth) {
        // Use Edge Function for custom auth users (bypasses RLS)
        const functionsUrl = process.env.REACT_APP_SUPABASE_FUNCTIONS_URL || 'https://zekigaxnilsrennylvnw.supabase.co/functions/v1';
        
        const profileResponse = await fetch(`${functionsUrl}/create-profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            userId: user.id,
            photoUrl,
            questionnaireData: data.questionnaire,
            phoneNumber: user.phone_number
          })
        });

        const profileResult = await profileResponse.json();
        
        if (!profileResult.success) {
          throw new Error(profileResult.error || 'Profile creation failed');
        }
        
        console.log('✅ Profile created successfully via Edge Function:', profileResult);
        
        // If Edge Function returned a different user ID (due to phone number match), update our local state
        if (profileResult.userId && profileResult.userId !== user.id) {
          console.log(`🔄 Edge Function returned different user ID: ${profileResult.userId}, updating local state`);
          const updatedUser = { ...user, id: profileResult.userId, profile_completed: true };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          await updateUser(updatedUser);
        } else {
          // Update user state to reflect completed profile
          await updateUser({ profile_completed: true });
        }
      } else {
        // Use direct Supabase for email auth users
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            photo_url: photoUrl,
            questionnaire_data: data.questionnaire,
            ai_analysis: null // Will be populated later by AI service
          });

        if (profileError) {
          throw new Error(`Profile creation failed: ${profileError.message}`);
        }

        // Update user's profile_completed status
        const { error: userUpdateError } = await supabase
          .from('users')
          .update({ profile_completed: true })
          .eq('id', user.id);

        if (userUpdateError) {
          throw new Error(`User update failed: ${userUpdateError.message}`);
        }

        // Refresh user profile to get updated data
        await refreshProfile();
      }

      console.log('🚀 About to navigate to /matching...');
      
      // Navigate to matching page
      navigate('/matching');
      
      console.log('✅ Navigation to /matching completed');

    } catch (err) {
      console.error('Profile setup error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!watchedData.photo;
      case 2:
        const q = watchedData.questionnaire;
        return !!(
          q.relationship_intent &&
          q.want_children &&
          q.social_energy &&
          q.adventure_level &&
          q.important_values?.length > 0 &&
          q.political_alignment &&
          q.humor_style &&
          q.conflict_style &&
          q.ideal_weekend?.length > 0 &&
          q.exercise_routine
        );
      case 3:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepContent>
            <StepTitle>📸 Upload Your Photo</StepTitle>
            <StepDescription>
              Add a great photo that shows your personality! This will be the first thing potential matches see.
            </StepDescription>
            <PhotoUpload onPhotoSelect={handlePhotoSelect} />
            {errors.photo && <ErrorMessage>{errors.photo.message}</ErrorMessage>}
          </StepContent>
        );

      case 2:
        return (
          <StepContent>
            <StepTitle>💭 Tell Us About You</StepTitle>
            <StepDescription>
              Answer these questions to help us find your perfect match. Be honest - authenticity leads to better connections!
            </StepDescription>
            <Questionnaire register={register} errors={errors} />
          </StepContent>
        );

      case 3:
        return (
          <StepContent>
            <StepTitle>✨ Review Your Profile</StepTitle>
            <StepDescription>
              Looking good! Review your information before we start finding your matches.
            </StepDescription>
            
            <ReviewSection>
              <ReviewTitle>Photo</ReviewTitle>
              {watchedData.photo && (
                <PhotoPreview 
                  src={URL.createObjectURL(watchedData.photo)} 
                  alt="Profile preview" 
                />
              )}
            </ReviewSection>

            <ReviewSection>
              <ReviewTitle>About You</ReviewTitle>
              <ReviewItem>
                <ReviewLabel>Looking for</ReviewLabel>
                <ReviewValue>{watchedData.questionnaire.relationship_intent}</ReviewValue>
              </ReviewItem>
              <ReviewItem>
                <ReviewLabel>Children</ReviewLabel>
                <ReviewValue>{watchedData.questionnaire.want_children}</ReviewValue>
              </ReviewItem>
              <ReviewItem>
                <ReviewLabel>Social Style</ReviewLabel>
                <ReviewValue>{watchedData.questionnaire.social_energy}</ReviewValue>
              </ReviewItem>
              <ReviewItem>
                <ReviewLabel>Adventure Level</ReviewLabel>
                <ReviewValue>{watchedData.questionnaire.adventure_level}</ReviewValue>
              </ReviewItem>
              <ReviewItem>
                <ReviewLabel>Important Values</ReviewLabel>
                <ReviewValue>{watchedData.questionnaire.important_values?.join(', ')}</ReviewValue>
              </ReviewItem>
            </ReviewSection>
          </StepContent>
        );

      default:
        return null;
    }
  };

  return (
    <Container>
      <LogoutButton onClick={handleLogout}>
        Sign Out
      </LogoutButton>
      
      <Card>
        <Header>
          <Title>Create Your Profile</Title>
          
          <StepIndicator>
            <StepDot active={currentStep === 1} completed={currentStep > 1} />
            <StepConnector completed={currentStep > 1} />
            <StepDot active={currentStep === 2} completed={currentStep > 2} />
            <StepConnector completed={currentStep > 2} />
            <StepDot active={currentStep === 3} completed={false} />
          </StepIndicator>
          
          <StepLabel>
            Step {currentStep} of 3
          </StepLabel>
        </Header>

        <Form onSubmit={handleSubmit(onSubmit)}>
          {renderStepContent()}

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <ButtonGroup>
            {currentStep > 1 && (
              <Button type="button" variant="secondary" onClick={handleBack}>
                ← Back
              </Button>
            )}
            
            {currentStep < 3 ? (
              <Button 
                type="button" 
                onClick={handleNext}
                disabled={!isStepValid(currentStep)}
              >
                Next →
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={loading || !isStepValid(currentStep)}
              >
                {loading ? 'Creating Profile...' : 'Complete Profile ✨'}
              </Button>
            )}
          </ButtonGroup>
        </Form>
      </Card>
    </Container>
  );
}; 