// Simple Vocab Trainer - app.js
const STORAGE_KEY = 'mini-vocab-trainer:v1';

let state = {
  words: [],         // {id, word, translation, example}
  quiz: { index: -1, current: null, correct: 0, attempts: 0, used: [] }
};

// --- DOM refs
const addForm = document.getElementById('addForm');
const wordInput = document.getElementById('word');
const transInput = document.getElementById('translation');
const exampleInput = document.getElementById('example');
const wordList = document.getElementById('wordList');

const startBtn = document.getElementById('startBtn');
const nextBtn = document.getElementById('nextBtn');
const question = document.getElementById('question');
const choicesWrap = document.getElementById('choices');

const stats = document.getElementById('stats');
const scoreEl = document.getElementById('score');
const clearAll = document.getElementById('clearAll');

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.words));
}

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  state.words = raw ? JSON.parse(raw) : [];
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}

// render list
function renderList(){
  wordList.innerHTML = '';
  if(state.words.length === 0){
    wordList.innerHTML = '<li class="meta">No words yet. Add some!</li>';
    return;
  }
  state.words.forEach(w=>{
    const li = document.createElement('li');
    li.className = 'wordItem';
    li.innerHTML = `
      <div class="wordBlock">
        <b>${escapeHtml(w.word)}</b>
        <div class="meta">${escapeHtml(w.translation)} ${w.example ? '• ' + escapeHtml(w.example): ''}</div>
      </div>
      <div class="controls">
        <button data-id="${w.id}" class="editBtn">Edit</button>
        <button data-id="${w.id}" class="delBtn danger">Delete</button>
      </div>
    `;
    wordList.appendChild(li);
  });

  // attach handlers
  wordList.querySelectorAll('.delBtn').forEach(btn=>{
    btn.onclick = e=>{
      const id = btn.dataset.id;
      state.words = state.words.filter(x=>x.id !== id);
      save();
      renderList();
      renderStats();
    };
  });

  wordList.querySelectorAll('.editBtn').forEach(btn=>{
    btn.onclick = e=>{
      const id = btn.dataset.id;
      const w = state.words.find(x=>x.id===id);
      if(!w) return;
      // prefill form to edit (simple approach: delete & prefill)
      wordInput.value = w.word;
      transInput.value = w.translation;
      exampleInput.value = w.example || '';
      state.words = state.words.filter(x=>x.id !== id);
      save();
      renderList();
    };
  });
}

// safe text
function escapeHtml(s='') {
  return String(s).replace(/[&<>"'`]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;' }[c]));
}

// add form
addForm.addEventListener('submit', e=>{
  e.preventDefault();
  const w = wordInput.value.trim();
  const t = transInput.value.trim();
  const ex = exampleInput.value.trim();
  if(!w || !t) return;
  state.words.push({ id: uid(), word: w, translation: t, example: ex });
  save();
  renderList();
  renderStats();
  addForm.reset();
});

// clear all
clearAll.addEventListener('click', ()=>{
  if(!confirm('Clear ALL words?')) return;
  state.words = [];
  save();
  renderList();
  renderStats();
  resetQuiz();
});

// stats
function renderStats(){
  stats.textContent = `Words: ${state.words.length} • Correct: ${state.quiz.correct} • Attempts: ${state.quiz.attempts}`;
  scoreEl.textContent = state.quiz.attempts ? `Score: ${Math.round((state.quiz.correct / state.quiz.attempts) * 100)}%` : '';
}

// Quiz helpers
function shuffle(a){
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function pickQuestion(){
  if(state.words.length < 2) return null;
  // pick a word not used yet (or reset)
  if(state.quiz.used.length >= state.words.length) state.quiz.used = [];
  const remaining = state.words.filter(w => !state.quiz.used.includes(w.id));
  const chosen = remaining[Math.floor(Math.random()*remaining.length)];
  state.quiz.used.push(chosen.id);
  // pick 3 wrong answers
  const wrongPool = state.words.filter(w => w.id !== chosen.id);
  shuffle(wrongPool);
  const choices = [chosen.translation, ...wrongPool.slice(0,3).map(x=>x.translation)];
  shuffle(choices);
  return {question: chosen.word, answer: chosen.translation, choices};
}

function renderQuestion(qObj){
  if(!qObj){
    question.textContent = 'Add at least 2 words to start practicing.';
    choicesWrap.innerHTML = '';
    nextBtn.style.display = 'none';
    return;
  }
  question.textContent = `Translate: "${qObj.question}"`;
  choicesWrap.innerHTML = '';
  qObj.choices.forEach(ch=>{
    const b = document.createElement('button');
    b.className = 'choiceBtn';
    b.textContent = ch;
    b.onclick = ()=>handleChoice(b, ch, qObj.answer);
    choicesWrap.appendChild(b);
  });
  nextBtn.style.display = 'none';
}

function handleChoice(btn, choice, correct){
  // disable all
  Array.from(choicesWrap.children).forEach(x=>x.disabled=true);
  state.quiz.attempts++;
  if(choice === correct){
    btn.classList.add('correct');
    state.quiz.correct++;
  } else {
    btn.classList.add('wrong');
    // highlight correct
    Array.from(choicesWrap.children).forEach(x=>{
      if(x.textContent === correct) x.classList.add('correct');
    });
  }
  nextBtn.style.display = 'inline-block';
  renderStats();
}

function resetQuiz(){
  state.quiz = { index: -1, current: null, correct: 0, attempts: 0, used: [] };
  renderStats();
  renderQuestion(null);
}

startBtn.addEventListener('click', ()=>{
  if(state.words.length < 2) {
    alert('Add at least 2 words to start.');
    return;
  }
  state.quiz.current = pickQuestion();
  renderQuestion(state.quiz.current);
});

nextBtn.addEventListener('click', ()=>{
  state.quiz.current = pickQuestion();
  renderQuestion(state.quiz.current);
});

// init
function init(){
  load();
  renderList();
  resetQuiz();
}

init();
