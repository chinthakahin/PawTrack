import React, { useState } from 'react';

const AnimalAIIdentifier = ({ onNavigate }) => {
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState('');
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Convert image file to Base64
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setMimeType(file.type);
    setError('');
    setResult(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      // Remove Data URL prefix to extract raw Base64 string
      const base64Data = reader.result.split(',')[1];
      setImageBase64(base64Data);
    };
    reader.readAsDataURL(file);
  };

  // Send request to Backend API
  const handleAnalyze = async () => {
    if (!imageBase64) {
      setError('Please select an animal image first!');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // මෙතන තමයි Localhost ලින්ක් එකට වෙනස් කළේ 👇
      const response = await fetch('http://localhost:5000/api/ai/identify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
          mimeType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || 'AI analysis failed.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to connect to backend server. Please verify port 5000 is running.');
    } finally {
      setLoading(false);
    }
  };

  // Save AI details to localStorage and navigate to Register page
  const handleRegisterClick = () => {
    if (!result) return;

    const draftData = {
      species: result.species || '',
      healthCondition: result.healthCondition || '',
      description: result.summary || '',
      keyFeatures: result.keyFeatures || [],
      image: imagePreview || '',
    };

    localStorage.setItem('ai_animal_draft', JSON.stringify(draftData));

    if (onNavigate) {
      onNavigate('/register');
    }
  };

  return (
    <div style={styles.container}>
      <h2>🐾 AI Animal Identification & Health Check</h2>
      <p>Upload an image to identify the animal using Gemini AI.</p>

      {/* File / Camera Input */}
      <div style={styles.inputContainer}>
        <input
          type="file"
          accept="image/*"
          capture="environment" // Capture directly from mobile camera
          onChange={handleImageChange}
          style={styles.fileInput}
        />
      </div>

      {/* Preview Section */}
      {imagePreview && (
        <div style={styles.previewBox}>
          <img src={imagePreview} alt="Preview" style={styles.previewImage} />
          <button
            onClick={handleAnalyze}
            disabled={loading}
            style={loading ? styles.buttonDisabled : styles.button}
          >
            {loading ? '🔍 Analyzing with Gemini AI...' : '✨ Identify Animal'}
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && <div style={styles.errorBox}>{error}</div>}

      {/* Results Display */}
      {result && (
        <div style={styles.resultCard}>
          <h3>🔍 Analysis Results</h3>
          
          <div style={styles.resultItem}>
            <strong>Species / Breed:</strong> <span>{result.species}</span>
          </div>

          <div style={styles.resultItem}>
            <strong>Health Condition:</strong>{' '}
            <span style={styles.badge}>{result.healthCondition}</span>
          </div>

          <div style={styles.resultItem}>
            <strong>Key Features:</strong>
            <ul>
              {result.keyFeatures?.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>

          <div style={styles.resultItem}>
            <strong>AI Summary:</strong>
            <p>{result.summary}</p>
          </div>

          {/* Action Button: Register this Animal */}
          <button onClick={handleRegisterClick} style={styles.registerBtn}>
            ➕ Register this Animal with AI Data
          </button>
        </div>
      )}
    </div>
  );
};

// Basic Styling
const styles = {
  container: {
    maxWidth: '600px',
    margin: '20px auto',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    backgroundColor: '#fff',
    fontFamily: 'sans-serif',
  },
  inputContainer: {
    marginBottom: '15px',
  },
  fileInput: {
    padding: '10px',
    width: '100%',
  },
  previewBox: {
    textAlign: 'center',
    margin: '15px 0',
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: '280px',
    borderRadius: '8px',
    marginBottom: '10px',
  },
  button: {
    backgroundColor: '#4F46E5',
    color: '#fff',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    color: '#fff',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'not-allowed',
    fontSize: '16px',
    width: '100%',
  },
  registerBtn: {
    backgroundColor: '#10B981',
    color: '#fff',
    padding: '12px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    width: '100%',
    marginTop: '15px',
  },
  errorBox: {
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    padding: '10px',
    borderRadius: '6px',
    marginTop: '10px',
  },
  resultCard: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#F3F4F6',
    borderRadius: '8px',
    textAlign: 'left',
  },
  resultItem: {
    marginBottom: '10px',
  },
  badge: {
    backgroundColor: '#10B981',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '14px',
  },
};

export default AnimalAIIdentifier;