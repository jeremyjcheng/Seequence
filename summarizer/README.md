# Seequence Python Summarizer

Advanced NLP-based text summarization for the Seequence Chrome extension using Python's powerful NLP libraries.

## Features

- **Advanced NLP Processing**: Uses NLTK and spaCy for sophisticated text analysis
- **Extractive Summarization**: Selects the most important sentence from the text
- **Named Entity Recognition**: Identifies and prioritizes important entities (people, places, organizations)
- **Smart Scoring**: Combines word frequency, position, length, and entity analysis
- **Fallback Support**: Works even without advanced libraries installed
- **JSON Output**: Structured output for easy integration

## Installation

1. **Install Python 3** (if not already installed)
2. **Run the setup script**:
   ```bash
   cd summarizer
   ./setup.sh
   ```

This will install:

- NLTK (Natural Language Toolkit)
- spaCy with English language model
- All required dependencies

## Usage

### Command Line

```bash
# Summarize text directly
python3 summarizer.py --text "Your text here"

# Summarize from file
cat your_file.txt | python3 summarizer.py

# Get JSON output
python3 summarizer.py --text "Your text here" --json

# Custom max length
python3 summarizer.py --text "Your text here" --max-length 150
```

### Integration with Chrome Extension

The Chrome extension automatically calls this Python script when available. It falls back to JavaScript-based summarization if Python is not available.

## How It Works

1. **Text Preprocessing**: Cleans and normalizes the input text
2. **Sentence Extraction**: Splits text into meaningful sentences
3. **Keyword Analysis**: Identifies important words using frequency analysis
4. **Scoring Algorithm**: Each sentence gets scored based on:
   - Word frequency (important words appear more often)
   - Position (first sentences often contain main topics)
   - Length (optimal sentence length gets higher scores)
   - Named entities (people, places, organizations get extra points)
5. **Best Sentence Selection**: Chooses the highest-scoring sentence
6. **Smart Truncation**: Truncates at word boundaries if too long

## Advanced Features

- **Named Entity Recognition**: Uses spaCy to identify important entities
- **Stemming**: Reduces words to their root forms for better matching
- **Stop Word Filtering**: Removes common words that don't add meaning
- **Position Weighting**: First sentences get priority (often contain main topics)
- **Length Optimization**: Penalizes very short or very long sentences

## Fallback Behavior

If advanced libraries aren't available, the summarizer falls back to:

- Basic sentence splitting
- Simple word frequency analysis
- Manual stop word filtering
- Basic scoring algorithm

## Example Output

**Input**: "Eric Patrick Clapton (born 30 March 1945) is an English rock and blues guitarist, singer, and songwriter. He is the only three-time inductee to the Rock and Roll Hall of Fame..."

**Output**: "Eric Patrick Clapton is an English rock and blues guitarist, singer, and songwriter."

## Troubleshooting

### Python Not Found

- Install Python 3 from [python.org](https://python.org)
- Make sure `python3` is in your PATH

### spaCy Model Not Found

```bash
python3 -m spacy download en_core_web_sm
```

### Permission Denied

```bash
chmod +x setup.sh
```

## Performance

- **Fast**: Processes text in milliseconds
- **Accurate**: Uses state-of-the-art NLP techniques
- **Lightweight**: Minimal memory footprint
- **Reliable**: Graceful fallbacks ensure it always works
