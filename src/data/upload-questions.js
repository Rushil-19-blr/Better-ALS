import { db } from '../firebase.js';
import { collection, doc, setDoc } from 'firebase/firestore';
import { questions } from './mock-data.js';

/**
 * Run this script to migrate the mock questions into your live Firestore database.
 * Usage: 
 * Ensure Firebase is configured in src/firebase.js with actual credentials.
 * Call uploadAllQuestionsToFirestore() from your browser console or a temporary button.
 */
export async function uploadAllQuestionsToFirestore() {
  if (!db) {
    console.error("Firestore is not initialized. Please configure src/firebase.js.");
    return;
  }

  console.log("Starting upload of questions to Firestore...");
  let count = 0;
  
  for (const kcId of Object.keys(questions)) {
    const qList = questions[kcId];
    
    // We store each question in a generic 'questions' collection 
    // with kcId as a field, or inside a subcollection.
    for (const q of qList) {
      try {
        const qRef = doc(collection(db, 'questions'), q.id);
        await setDoc(qRef, {
          kcId: kcId,
          text: q.text,
          options: q.options,
          correct: q.correct,
          difficulty: q.difficulty || 'medium',
          createdAt: new Date().toISOString()
        });
        count++;
      } catch (err) {
        console.error(\`Failed to upload question ${q.id}: \`, err);
      }
    }
  }
  
  console.log(\`Successfully uploaded ${count} questions to Firestore.\`);
}
