const API = "https://www.themealdb.com/api/json/v1/1/";
const list = document.getElementById("list");
const modal = document.getElementById("modal");
const box = document.getElementById("box");

const cache = JSON.parse(localStorage.getItem("tr") || "{}");
function save() {
  try { localStorage.setItem("tr", JSON.stringify(cache)); } catch (e) {}
}

async function gt(text, from, to) {
  const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl="
    + from + "&tl=" + to + "&dt=t&q=" + encodeURIComponent(text);
  const r = await fetch(url);
  const d = await r.json();
  return d[0].map((x) => x[0]).join("");
}

async function tr(text) {
  if (!text) return text;
  if (cache[text]) return cache[text];
  const parts = [];
  let cur = "";
  for (const line of text.split("\n")) {
    if ((cur + line).length > 1200) { parts.push(cur); cur = ""; }
    cur += line + "\n";
  }
  if (cur) parts.push(cur);
  try {
    const out = [];
    for (const p of parts) out.push(await gt(p, "en", "uk"));
    const res = out.join("").trim();
    cache[text] = res;
    save();
    return res;
  } catch (e) {
    return text;
  }
}

async function search(text) {
  list.innerHTML = '<p class="msg">Шукаю...</p>';
  try {
    let q = text;
    if (/[а-яіїєґ]/i.test(q)) q = await gt(q, "uk", "en");
    const r = await fetch(API + "search.php?s=" + encodeURIComponent(q));
    const data = await r.json();
    show(data.meals);
  } catch (e) {
    list.innerHTML = '<p class="msg">Немає інтернету або помилка</p>';
  }
}

async function show(meals) {
  if (!meals) {
    list.innerHTML = '<p class="msg">Нічого не знайдено 😕</p>';
    return;
  }
  list.innerHTML = "";
  const names = [];
  meals.forEach((m, i) => {
    const c = document.createElement("div");
    c.className = "card";
    c.style.animationDelay = i * 60 + "ms";
    c.innerHTML = `<img loading="lazy" src="${m.strMealThumb}/small"><p>${m.strMeal}</p>`;
    c.onclick = () => open(m);
    list.appendChild(c);
    names.push(c.querySelector("p"));
  });
  const t = (await tr(meals.map((m) => m.strMeal).join("\n"))).split("\n");
  if (t.length === names.length) {
    names.forEach((p, i) => (p.textContent = t[i]));
  }
}

async function open(m) {
  if (!m.strInstructions) {
    const r = await fetch(API + "lookup.php?i=" + m.idMeal);
    m = (await r.json()).meals[0];
  }
  const ings = [];
  for (let i = 1; i <= 20; i++) {
    const ing = m["strIngredient" + i];
    if (ing && ing.trim()) {
      ings.push(ing + " — " + (m["strMeasure" + i] || "").trim());
    }
  }
  box.innerHTML = `
    <img src="${m.strMealThumb}">
    <h2 id="t">${m.strMeal}</h2>
    <h3>Інгредієнти</h3><ul id="ing"></ul>
    <h3>Приготування</h3><p id="ins">Перекладаю...</p>`;
  const ul = document.getElementById("ing");
  ul.innerHTML = ings.map((s) => `<li>${s}</li>`).join("");
  modal.classList.add("open");

  tr(m.strMeal).then((x) => (document.getElementById("t").textContent = x));
  tr(ings.join("\n")).then((x) => {
    const a = x.split("\n");
    if (a.length === ings.length) {
      ul.innerHTML = a.map((s) => `<li>${s}</li>`).join("");
    }
  });
  tr(m.strInstructions).then((x) => (document.getElementById("ins").textContent = x));
}

modal.onclick = (e) => {
  if (e.target === modal) modal.classList.remove("open");
};

document.getElementById("form").onsubmit = (e) => {
  e.preventDefault();
  const t = document.getElementById("q").value.trim();
  if (t) search(t);
};

search("chicken");

const CATS = [
  ["Chicken", "🍗 Курка"],
  ["Beef", "🥩 Яловичина"],
  ["Pork", "🥓 Свинина"],
  ["Lamb", "🍖 Баранина"],
  ["Seafood", "🐟 Морепродукти"],
  ["Pasta", "🍝 Паста"],
  ["Vegetarian", "🥦 Вегетаріанське"],
  ["Vegan", "🌱 Веганське"],
  ["Breakfast", "🍳 Сніданок"],
  ["Starter", "🥗 Закуски"],
  ["Side", "🍟 Гарніри"],
  ["Dessert", "🍰 Десерти"],
  ["Miscellaneous", "🍽 Різне"]
];

const cats = document.getElementById("cats");

function chip(text, fn) {
  const b = document.createElement("button");
  b.className = "chip";
  b.textContent = text;
  b.onclick = () => {
    document.querySelectorAll(".chip").forEach((x) => x.classList.remove("on"));
    b.classList.add("on");
    fn();
  };
  cats.appendChild(b);
  return b;
}

async function loadCat(c) {
  list.innerHTML = '<p class="msg">Завантажую...</p>';
  try {
    const r = await fetch(API + "filter.php?c=" + c);
    const d = await r.json();
    show(d.meals);
  } catch (e) {
    list.innerHTML = '<p class="msg">Немає інтернету або помилка</p>';
  }
}

async function randomMeal() {
  try {
    const r = await fetch(API + "random.php");
    const d = await r.json();
    open(d.meals[0]);
  } catch (e) {}
}

chip("🎲 Випадковий", randomMeal);
const first = chip(CATS[0][1], () => loadCat(CATS[0][0]));
CATS.slice(1).forEach(([k, v]) => chip(v, () => loadCat(k)));
first.classList.add("on");
loadCat("Chicken");

search = async function (text) {
  list.innerHTML = '<p class="msg">Шукаю...</p>';
  try {
    let q = text;
    if (/[а-яіїєґ]/i.test(q)) q = await gt(q, "uk", "en");
    let r = await fetch(API + "search.php?s=" + encodeURIComponent(q));
    let d = await r.json();
    if (!Array.isArray(d.meals)) {
      r = await fetch(API + "filter.php?i=" + encodeURIComponent(q.trim().replace(/ /g, "_")));
      d = await r.json();
    }
    show(Array.isArray(d.meals) ? d.meals : null);
  } catch (e) {
    list.innerHTML = '<p class="msg">Немає інтернету або помилка</p>';
  }
};

let cur = null;
const heart = document.getElementById("heart");
const favs = () => JSON.parse(localStorage.getItem("fav") || "{}");
function paint() {
  heart.textContent = favs()[cur.idMeal] ? "❤️" : "🤍";
}
const _open = open;
open = function (m) {
  cur = m;
  paint();
  return _open(m);
};
heart.onclick = () => {
  const f = favs();
  if (f[cur.idMeal]) delete f[cur.idMeal];
  else f[cur.idMeal] = { idMeal: cur.idMeal, strMeal: cur.strMeal, strMealThumb: cur.strMealThumb };
  localStorage.setItem("fav", JSON.stringify(f));
  paint();
};
const favChip = chip("❤️ Улюблені", () => {
  const v = Object.values(favs());
  if (v.length) show(v);
  else list.innerHTML = '<p class="msg">Поки порожньо. Відкрийте рецепт і натисніть 🤍</p>';
});
cats.prepend(favChip);
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
