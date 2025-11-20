# Quick Fix for Dependency Issues

## The Problem
You're getting `ModuleNotFoundError: No module named 'langchain_google_genai'` because of dependency conflicts.

## Solution

Run these commands in order:

```bash
# 1. Upgrade pip first
python -m pip install --upgrade pip

# 2. Install the compatible versions
pip install langchain==0.3.15 langchain-core==0.3.28 langchain-google-genai==2.0.8 google-generativeai==0.8.3

# 3. Install the rest of the requirements
pip install -r requirements.txt
```

## Alternative: Install Everything at Once

```bash
# Upgrade pip
python -m pip install --upgrade pip

# Install all dependencies (pip will resolve conflicts automatically)
pip install --upgrade -r requirements.txt
```

## Verify Installation

```bash
# Check if langchain-google-genai is installed
pip show langchain-google-genai

# Try importing it
python -c "from langchain_google_genai import ChatGoogleGenerativeAI; print('Success!')"
```

## Run the Server

```bash
uvicorn src.app:app --reload
```

## If Still Having Issues

Try a clean install:

```bash
# 1. Deactivate and delete virtual environment
deactivate
rmdir /s .venv

# 2. Create new virtual environment
python -m venv .venv
.venv\Scripts\activate

# 3. Upgrade pip
python -m pip install --upgrade pip

# 4. Install dependencies
pip install -r requirements.txt
```
