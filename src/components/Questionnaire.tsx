import React from 'react';
import styled from 'styled-components';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { ProfileSetupForm } from '../types';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const Section = styled.div`
  background: #f8f9ff;
  border-radius: 12px;
  padding: 24px;
  border-left: 4px solid #667eea;
`;

const SectionTitle = styled.h3`
  color: #333;
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
`;

const Question = styled.div`
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const QuestionText = styled.label`
  display: block;
  color: #333;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
`;

const OptionGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const RadioOption = styled.label`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #667eea;
    background: #f8f9ff;
  }
  
  input:checked + & {
    border-color: #667eea;
    background: #667eea;
    color: white;
  }
`;

const RadioInput = styled.input`
  margin-right: 12px;
`;

const CheckboxGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
`;

const CheckboxOption = styled.label`
  display: flex;
  align-items: center;
  padding: 12px;
  background: white;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #667eea;
    background: #f8f9ff;
  }
`;

const CheckboxInput = styled.input`
  margin-right: 8px;
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 14px;
  margin-top: 8px;
`;

interface QuestionnaireProps {
  register: UseFormRegister<ProfileSetupForm>;
  errors: FieldErrors<ProfileSetupForm>;
}

export const Questionnaire: React.FC<QuestionnaireProps> = ({ register, errors }) => {
  return (
    <Container>
      {/* Relationship Intent Section */}
      <Section>
        <SectionTitle>🎯 What are you looking for?</SectionTitle>
        
        <Question>
          <QuestionText>I'm looking for:</QuestionText>
          <OptionGroup>
            <RadioOption>
              <RadioInput
                {...register('questionnaire.relationship_intent', { required: 'Please select your relationship intent' })}
                type="radio"
                value="casual"
              />
              Casual coffee chats and meetups
            </RadioOption>
            <RadioOption>
              <RadioInput
                {...register('questionnaire.relationship_intent')}
                type="radio"
                value="serious"
              />
              A serious, committed relationship
            </RadioOption>
            <RadioOption>
              <RadioInput
                {...register('questionnaire.relationship_intent')}
                type="radio"
                value="marriage"
              />
              Marriage and building a life together
            </RadioOption>
          </OptionGroup>
          {errors.questionnaire?.relationship_intent && (
            <ErrorMessage>{errors.questionnaire.relationship_intent.message}</ErrorMessage>
          )}
        </Question>

        <Question>
          <QuestionText>Do you want children?</QuestionText>
          <OptionGroup>
            <RadioOption>
              <RadioInput
                {...register('questionnaire.want_children', { required: 'Please select your preference about children' })}
                type="radio"
                value="yes"
              />
              Yes, definitely want kids
            </RadioOption>
            <RadioOption>
              <RadioInput
                {...register('questionnaire.want_children')}
                type="radio"
                value="no"
              />
              No, don't want children
            </RadioOption>
            <RadioOption>
              <RadioInput
                {...register('questionnaire.want_children')}
                type="radio"
                value="maybe"
              />
              Maybe/open to it
            </RadioOption>
            <RadioOption>
              <RadioInput
                {...register('questionnaire.want_children')}
                type="radio"
                value="have_them"
              />
              I already have children
            </RadioOption>
          </OptionGroup>
          {errors.questionnaire?.want_children && (
            <ErrorMessage>{errors.questionnaire.want_children.message}</ErrorMessage>
          )}
        </Question>
      </Section>

      {/* Lifestyle Section */}
      <Section>
        <SectionTitle>🌟 Your Lifestyle</SectionTitle>
        
        <Question>
          <QuestionText>How do you recharge your social energy?</QuestionText>
          <OptionGroup>
            <RadioOption>
              <RadioInput
                {...register('questionnaire.social_energy', { required: 'Please select your social energy style' })}
                type="radio"
                value="parties"
              />
              Love parties and big gatherings
            </RadioOption>
            <RadioOption>
              <RadioInput
                {...register('questionnaire.social_energy')}
                type="radio"
                value="small_groups"
              />
              Prefer small groups of close friends
            </RadioOption>
            <RadioOption>
              <RadioInput
                {...register('questionnaire.social_energy')}
                type="radio"
                value="quiet_nights"
              />
              Enjoy quiet nights at home
            </RadioOption>
          </OptionGroup>
          {errors.questionnaire?.social_energy && (
            <ErrorMessage>{errors.questionnaire.social_energy.message}</ErrorMessage>
          )}
        </Question>

        <Question>
          <QuestionText>What's your adventure level?</QuestionText>
          <OptionGroup>
            <RadioOption>
              <RadioInput
                {...register('questionnaire.adventure_level', { required: 'Please select your adventure level' })}
                type="radio"
                value="spontaneous"
              />
              Spontaneous traveler - let's go anywhere!
            </RadioOption>
            <RadioOption>
              <RadioInput
                {...register('questionnaire.adventure_level')}
                type="radio"
                value="planned"
              />
              Planned explorer - I like having an itinerary
            </RadioOption>
            <RadioOption>
              <RadioInput
                {...register('questionnaire.adventure_level')}
                type="radio"
                value="homebody"
              />
              Homebody - I find adventure in familiar places
            </RadioOption>
          </OptionGroup>
          {errors.questionnaire?.adventure_level && (
            <ErrorMessage>{errors.questionnaire.adventure_level.message}</ErrorMessage>
          )}
        </Question>
      </Section>

      {/* Values Section */}
      <Section>
        <SectionTitle>💝 What matters most to you?</SectionTitle>
        
        <Question>
          <QuestionText>Select what's most important in your life: (Choose all that apply)</QuestionText>
          <CheckboxGroup>
            <CheckboxOption>
              <CheckboxInput
                {...register('questionnaire.important_values')}
                type="checkbox"
                value="family"
              />
              Family and relationships
            </CheckboxOption>
            <CheckboxOption>
              <CheckboxInput
                {...register('questionnaire.important_values')}
                type="checkbox"
                value="career"
              />
              Career and achievement
            </CheckboxOption>
            <CheckboxOption>
              <CheckboxInput
                {...register('questionnaire.important_values')}
                type="checkbox"
                value="personal_growth"
              />
              Personal growth and learning
            </CheckboxOption>
            <CheckboxOption>
              <CheckboxInput
                {...register('questionnaire.important_values')}
                type="checkbox"
                value="fun"
              />
              Fun and experiences
            </CheckboxOption>
            <CheckboxOption>
              <CheckboxInput
                {...register('questionnaire.important_values')}
                type="checkbox"
                value="health"
              />
              Health and fitness
            </CheckboxOption>
            <CheckboxOption>
              <CheckboxInput
                {...register('questionnaire.important_values')}
                type="checkbox"
                value="creativity"
              />
              Creativity and arts
            </CheckboxOption>
          </CheckboxGroup>
        </Question>

        <Question>
          <QuestionText>How important is political alignment?</QuestionText>
          <OptionGroup>
            <RadioOption>
              <RadioInput
                {...register('questionnaire.political_alignment', { required: 'Please select your preference' })}
                type="radio"
                value="very_important"
              />
              Very important - we should agree on major issues
            </RadioOption>
            <RadioOption>
              <RadioInput
                {...register('questionnaire.political_alignment')}
                type="radio"
                value="somewhat"
              />
              Somewhat important - we can agree to disagree
            </RadioOption>
            <RadioOption>
              <RadioInput
                {...register('questionnaire.political_alignment')}
                type="radio"
                value="not_important"
              />
              Not important - politics don't affect relationships
            </RadioOption>
          </OptionGroup>
          {errors.questionnaire?.political_alignment && (
            <ErrorMessage>{errors.questionnaire.political_alignment.message}</ErrorMessage>
          )}
        </Question>
      </Section>

      {/* Personality Section */}
      <Section>
        <SectionTitle>😄 Your Personality</SectionTitle>
        
        <Question>
          <QuestionText>What's your humor style?</QuestionText>
          <OptionGroup>
            <RadioOption>
              <RadioInput
                {...register('questionnaire.humor_style', { required: 'Please select your humor style' })}
                type="radio"
                value="witty"
              />
              Witty and sarcastic - I love clever banter
            </RadioOption>
            <RadioOption>
              <RadioInput
                {...register('questionnaire.humor_style')}
                type="radio"
                value="goofy"
              />
              Goofy and playful - silly jokes make me laugh
            </RadioOption>
            <RadioOption>
              <RadioInput
                {...register('questionnaire.humor_style')}
                type="radio"
                value="dry"
              />
              Dry and observational - I find humor in everyday life
            </RadioOption>
          </OptionGroup>
          {errors.questionnaire?.humor_style && (
            <ErrorMessage>{errors.questionnaire.humor_style.message}</ErrorMessage>
          )}
        </Question>

        <Question>
          <QuestionText>How do you handle conflict?</QuestionText>
          <OptionGroup>
            <RadioOption>
              <RadioInput
                {...register('questionnaire.conflict_style', { required: 'Please select your conflict style' })}
                type="radio"
                value="direct"
              />
              Direct discussion - let's talk it out immediately
            </RadioOption>
            <RadioOption>
              <RadioInput
                {...register('questionnaire.conflict_style')}
                type="radio"
                value="need_time"
              />
              Need time to process - I prefer to think before discussing
            </RadioOption>
            <RadioOption>
              <RadioInput
                {...register('questionnaire.conflict_style')}
                type="radio"
                value="avoid"
              />
              Avoid confrontation - I prefer harmony over conflict
            </RadioOption>
          </OptionGroup>
          {errors.questionnaire?.conflict_style && (
            <ErrorMessage>{errors.questionnaire.conflict_style.message}</ErrorMessage>
          )}
        </Question>
      </Section>

      {/* Lifestyle Preferences Section */}
      <Section>
        <SectionTitle>🎯 Ideal Weekend</SectionTitle>
        
        <Question>
          <QuestionText>Your perfect weekend includes: (Choose all that apply)</QuestionText>
          <CheckboxGroup>
            <CheckboxOption>
              <CheckboxInput
                {...register('questionnaire.ideal_weekend')}
                type="checkbox"
                value="outdoor"
              />
              Outdoor activities
            </CheckboxOption>
            <CheckboxOption>
              <CheckboxInput
                {...register('questionnaire.ideal_weekend')}
                type="checkbox"
                value="cultural"
              />
              Cultural events (museums, concerts)
            </CheckboxOption>
            <CheckboxOption>
              <CheckboxInput
                {...register('questionnaire.ideal_weekend')}
                type="checkbox"
                value="home_projects"
              />
              Home projects and relaxation
            </CheckboxOption>
            <CheckboxOption>
              <CheckboxInput
                {...register('questionnaire.ideal_weekend')}
                type="checkbox"
                value="social"
              />
              Social gatherings with friends
            </CheckboxOption>
            <CheckboxOption>
              <CheckboxInput
                {...register('questionnaire.ideal_weekend')}
                type="checkbox"
                value="travel"
              />
              Weekend trips and travel
            </CheckboxOption>
            <CheckboxOption>
              <CheckboxInput
                {...register('questionnaire.ideal_weekend')}
                type="checkbox"
                value="food"
              />
              Trying new restaurants
            </CheckboxOption>
          </CheckboxGroup>
        </Question>

        <Question>
          <QuestionText>What's your exercise routine like?</QuestionText>
          <OptionGroup>
            <RadioOption>
              <RadioInput
                {...register('questionnaire.exercise_routine', { required: 'Please select your exercise routine' })}
                type="radio"
                value="daily_gym"
              />
              Daily gym sessions - fitness is a priority
            </RadioOption>
            <RadioOption>
              <RadioInput
                {...register('questionnaire.exercise_routine')}
                type="radio"
                value="occasional_hikes"
              />
              Occasional hikes and outdoor activities
            </RadioOption>
            <RadioOption>
              <RadioInput
                {...register('questionnaire.exercise_routine')}
                type="radio"
                value="sports"
              />
              Sports leagues and group activities
            </RadioOption>
            <RadioOption>
              <RadioInput
                {...register('questionnaire.exercise_routine')}
                type="radio"
                value="not_my_thing"
              />
              Exercise isn't really my thing
            </RadioOption>
          </OptionGroup>
          {errors.questionnaire?.exercise_routine && (
            <ErrorMessage>{errors.questionnaire.exercise_routine.message}</ErrorMessage>
          )}
        </Question>
      </Section>
    </Container>
  );
}; 