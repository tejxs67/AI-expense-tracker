const categoryKeywords = {
  Food: ['food', 'restaurant', 'grocery', 'groceries', 'lunch', 'dinner', 'breakfast', 'coffee', 'pizza', 'burger', 'meal', 'eat', 'snack', 'cafe', 'diner', 'takeout', 'delivery', 'bakery', 'sushi', 'sandwich'],
  Transport: ['uber', 'lyft', 'taxi', 'gas', 'fuel', 'bus', 'train', 'metro', 'subway', 'car', 'parking', 'transport', 'travel', 'flight', 'airline', 'bike', 'scooter', 'rideshare'],
  Entertainment: ['movie', 'game', 'concert', 'theater', 'netflix', 'spotify', 'hulu', 'disney', 'gaming', 'music', 'show', 'party', 'drink', 'bar', 'club', 'ticket', 'event', 'streaming'],
  Shopping: ['amazon', 'walmart', 'target', 'shop', 'buy', 'purchase', 'clothes', 'shoes', 'store', 'mall', 'retail', 'online', 'order', 'fashion', 'electronics', 'furniture', 'home', 'hardware'],
  Bills: ['bill', 'electricity', 'water', 'internet', 'phone', 'rent', 'mortgage', 'insurance', 'utility', 'subscription', 'membership', 'service', 'cable', 'netflix', 'spotify'],
  Healthcare: ['doctor', 'medicine', 'pharmacy', 'hospital', 'clinic', 'health', 'dental', 'vision', 'prescription', 'vitamin', 'supplement', 'medical', 'therapy', 'wellness'],
  Education: ['school', 'college', 'university', 'course', 'book', 'textbook', 'education', 'tuition', 'class', 'learning', 'tutorial', 'workshop', 'seminar', 'training'],
  Others: ['gift', 'donation', 'charity', 'tip', 'misc', 'other', 'general', 'personal']
};

export const suggestCategory = (description) => {
  if (!description || typeof description !== 'string') {
    return 'Others';
  }

  const lowerDescription = description.toLowerCase();

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerDescription.includes(keyword)) {
        return category;
      }
    }
  }

  return 'Others';
};

export const parseNaturalLanguage = (text) => {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const result = {
    amount: null,
    description: '',
    date: new Date(),
    suggestedCategory: null
  };

  // Extract amount
  const amountMatch = text.match(/\$?(\d+(?:\.\d{1,2})?)/);
  if (amountMatch) {
    result.amount = parseFloat(amountMatch[1]);
  }

  // Parse date keywords
  const lowerText = text.toLowerCase();
  const today = new Date();

  if (lowerText.includes('today')) {
    result.date = today;
  } else if (lowerText.includes('yesterday')) {
    result.date = new Date(today.setDate(today.getDate() - 1));
  } else if (lowerText.includes('last week')) {
    result.date = new Date(today.setDate(today.getDate() - 7));
  } else if (lowerText.includes('last month')) {
    result.date = new Date(today.setMonth(today.getMonth() - 1));
  }

  // Extract description (remove amount and common words)
  let description = text
    .replace(/\$?\d+(?:\.\d{1,2})?/g, '')
    .replace(/today|yesterday|last week|last month/gi, '')
    .replace(/spent|paid|bought|on|for|at/gi, '')
    .trim();

  result.description = description || text;

  // Suggest category based on description
  result.suggestedCategory = suggestCategory(result.description);

  return result;
};
