import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import QuestionPanel from './QuestionPanel';

const courses = ["CMSC351", "CMSC320", "COMM107", "MATH240", "MATH246", "MATH241"];

const Study = () => {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [writtenAnswer, setWrittenAnswer] = useState('');
  const [mcqSelectedOption, setMcqSelectedOption] = useState(null);
  const [showNextButton, setShowNextButton] = useState(false);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const handleCourseSelect = async (course) => {
    setSelectedCourse(course);
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://161.35.127.128:5000/generate_question?user_id=${1}&course=${course}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const initialData = await response.json();
      console.log("Initial data:", initialData);
      if (initialData.result) {
        setCurrentTopic(initialData.course_topic);
        setQuestions([initialData.result]);
        setCurrentQuestionIndex(0);
      } else {
        throw new Error("No question data in the response");
      }
    } catch (error) {
      console.error('Error fetching initial question:', error);
      setError("Failed to fetch the initial question. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWrittenAnswerChange = (e) => {
    setWrittenAnswer(e.target.value);
  };

  const handleMcqOptionSelect = (option) => {
    setMcqSelectedOption(option);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setFeedback(null);

    const currentQuestion = questions[currentQuestionIndex];
    
    try {
      let answerToSubmit;
      if (currentQuestion.type === 'MCQ') {
        answerToSubmit = mcqSelectedOption;
      } else {
        answerToSubmit = writtenAnswer;
      }

      const response = await fetch('http://161.35.127.128:5000/check_answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: {
            course: selectedCourse,
            course_topic: currentTopic,
            question_type: currentQuestion.type,
            difficulty: currentQuestion.difficulty,
            ...currentQuestion.question
          },
          sample: currentQuestion.question.Answer,
          answer: answerToSubmit,
          user_id: "1" // Replace with actual user ID
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to check answer');
      }

      const data = await response.json();
      setFeedback({
        message: data.result,
        isCorrect: data.correct // Note the lowercase 'correct'
      });
      setShowNextButton(true);
    } catch (error) {
      console.error('Error checking answer:', error);
      setError('Failed to check answer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextQuestion = async () => {
    setIsLoading(true);
    setError(null);
    setFeedback(null);
    setWrittenAnswer('');
    setMcqSelectedOption(null);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setShowNextButton(false);
      setIsLoading(false);
    } else {
      try {
        console.log("Fetching next question for:", selectedCourse, currentTopic);
        const response = await fetch(`http://161.35.127.128:5000/generate_question?user_id=${1}&flag=${true}&course=${selectedCourse}&course_topic=${currentTopic}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const newQuestionData = await response.json();
        console.log("New question data:", newQuestionData);
        if (newQuestionData.result) {
          setQuestions(prevQuestions => [...prevQuestions, newQuestionData.result]);
          setCurrentQuestionIndex(prevIndex => prevIndex + 1);
          setCurrentTopic(newQuestionData.course_topic);
          setShowNextButton(false);
        } else {
          throw new Error("No question data in the response");
        }
      } catch (error) {
        console.error('Error fetching next question:', error);
        setError("Failed to fetch the next question. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
      setWrittenAnswer('');
      setMcqSelectedOption(null);
      setShowNextButton(false);
      setFeedback(null);
    }
  };

  const isFinalQuestionAnswered = () => {
    return showNextButton;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-indigo-600 flex items-center justify-center p-5">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="bg-white bg-opacity-20 backdrop-blur-lg rounded-xl shadow-lg p-8 w-full max-w-4xl mx-auto"
      >
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-red-500 text-center mb-4"
            >
              <ReactMarkdown>{error}</ReactMarkdown>
            </motion.div>
          )}
          {!selectedCourse ? (
            <motion.div
              key="course-selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <h2 className="text-4xl mb-8 text-white text-center font-bold">Select a Course to Study</h2>
              <div className="flex flex-wrap justify-center gap-4">
                {courses.map((course) => (
                  <motion.button
                    key={course}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCourseSelect(course)}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-300 text-lg font-semibold"
                  >
                    {course}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : isLoading ? (
            <motion.h2
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-4xl text-center text-white font-bold"
            >
              Loading...
            </motion.h2>
          ) : questions.length > 0 && currentQuestionIndex < questions.length ? (
            <motion.div
              key="question-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <QuestionPanel
                type={questions[currentQuestionIndex].type}
                difficulty={questions[currentQuestionIndex].difficulty}
                question={questions[currentQuestionIndex].question}
                writtenAnswer={writtenAnswer}
                mcqSelectedOption={mcqSelectedOption}
                onWrittenAnswerChange={handleWrittenAnswerChange}
                onMcqOptionSelect={handleMcqOptionSelect}
                onSubmit={handleSubmit}
                showNextButton={showNextButton}
                onNextQuestion={handleNextQuestion}
                onPreviousQuestion={handlePreviousQuestion}
                currentQuestionIndex={currentQuestionIndex}
                totalQuestions={questions.length}
                isFinalQuestionAnswered={isFinalQuestionAnswered()}
                isLoading={isLoading}
                feedback={feedback}
              />
            </motion.div>
          ) : (
            <motion.h2
              key="no-questions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-4xl text-center text-white font-bold"
            >
              <ReactMarkdown>No questions available. Please try again.</ReactMarkdown>
            </motion.h2>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Study;