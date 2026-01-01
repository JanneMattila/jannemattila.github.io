(() => {
	const strings = {
		fi: {
			errorPlayersRange: "Pelaajien määrä pitää olla 2–20.",
			errorImpostorRange: "Huijareiden määrä pitää olla 1–5.",
			errorImpostorVsPlayers: "Huijareita ei voi olla enemmän kuin pelaajia.",
			errorNoCategory: "Valitse vähintään yksi kategoria.",
			errorNoWord: "Valittuihin kategorioihin ei löytynyt sanoja.",
			roleImpostor: "Olet huijari",
			roleCrew: "Olet pelaaja",
			buttonNext: "Seuraava pelaaja",
			buttonDone: "Valmis"
		}
	};

	const WORDS_BASE_PATH = "words/fi-fi/";
	const CATEGORIES_FILE = `${WORDS_BASE_PATH}categories.json`;

	let lang = "fi";

	const state = {
		words: [],
		categorySources: [],
		categories: [],
		players: [],
		currentIndex: 0,
		selectedWord: null,
		selectedCategory: null,
		selectedHint: null,
		useHint: true,
		cardViewed: false
	};

	const els = {
		setupSection: document.getElementById("setupSection"),
		cardSection: document.getElementById("cardSection"),
		appTitle: document.getElementById("appTitle"),
		form: document.getElementById("setupForm"),
		playerCount: document.getElementById("playerCount"),
		impostorCount: document.getElementById("impostorCount"),
		useHint: document.getElementById("useHint"),
		categoryList: document.getElementById("categoryList"),
		errorBox: document.getElementById("errorBox"),
		playerProgress: document.getElementById("playerProgress"),
		card: document.getElementById("card"),
		cardFront: document.getElementById("cardFront"),
		cardFrontMain: document.getElementById("cardFrontMain"),
		cardFrontSub: document.getElementById("cardFrontSub"),
		cardPlayerFront: document.getElementById("cardPlayerFront"),
		cardPlayer: document.getElementById("cardPlayer"),
		cardRole: document.getElementById("cardRole"),
		cardWord: document.getElementById("cardWord"),
		cardHint: document.getElementById("cardHint"),
		nextButton: document.getElementById("nextButton")
	};

	function t(key) {
		return strings[lang]?.[key] ?? key;
	}

	async function fetchJson(path) {
		const res = await fetch(path, { cache: "no-cache" });
		if (!res.ok) {
			throw new Error(`Failed to fetch ${path}: ${res.status}`);
		}
		return res.json();
	}

	async function loadWords() {
		try {
			const categorySources = await fetchJson(CATEGORIES_FILE);
			state.categorySources = Array.isArray(categorySources) ? categorySources : [];

			if (!state.categorySources.length) {
				showError("Kategorioita ei löytynyt.");
				return;
			}

			state.categories = state.categorySources.map((c) => c.category);
			renderCategories();

			const wordResults = await Promise.allSettled(
				state.categorySources.map(async (entry) => {
					const items = await fetchJson(`${WORDS_BASE_PATH}${entry.file}`);
					if (!Array.isArray(items)) return [];
					return items
						.filter((item) => item?.word)
						.map((item) => ({
							category: item.category ?? entry.category,
							word: item.word,
							hint: item.hint ?? ""
						}));
				})
			);

			state.words = wordResults
				.filter((result) => result.status === "fulfilled")
				.flatMap((result) => result.value);

			const failedSources = wordResults.filter((result) => result.status === "rejected");
			if (failedSources.length) {
				console.warn("Some category files failed to load", failedSources);
			}

			if (!state.words.length) {
				showError("Sanatiedostojen lataus epäonnistui.");
			}
		} catch (err) {
			showError("Sanatiedostojen lataus epäonnistui.");
			console.error(err);
		}
	}

	function renderCategories() {
		els.categoryList.innerHTML = "";
		state.categories.forEach((category, idx) => {
			const id = `cat-${idx}`;
			const wrapper = document.createElement("label");
			wrapper.className = "category-item";

			const checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.value = category;
			checkbox.id = id;
			if (category === "Helpot sanat") {
				checkbox.checked = true;
			}

			const span = document.createElement("span");
			span.textContent = category;

			wrapper.appendChild(checkbox);
			wrapper.appendChild(span);
			els.categoryList.appendChild(wrapper);
		});
	}

	function showError(message) {
		els.errorBox.textContent = message || "";
	}

	function collectSelectedCategories() {
		const checkboxes = els.categoryList.querySelectorAll("input[type=checkbox]");
		return Array.from(checkboxes)
			.filter((cb) => cb.checked)
			.map((cb) => cb.value);
	}

	function pickRandom(arr) {
		return arr[Math.floor(Math.random() * arr.length)];
	}

	function pickImpostorIndexes(count, playerTotal) {
		const set = new Set();
		while (set.size < count) {
			set.add(Math.floor(Math.random() * playerTotal));
		}
		return Array.from(set);
	}

	function resetCardView() {
		els.card.classList.remove("flipped");
		els.cardHint.classList.add("hidden");
		els.cardFrontMain.textContent = "Korttia ei ole vielä käännetty";
		els.cardFrontSub.textContent = "";
		els.nextButton.disabled = true;
		els.nextButton.classList.add("hidden");
		state.cardViewed = false;
	}

	function showSetupView() {
		els.setupSection.classList.remove("hidden");
		els.cardSection.classList.add("hidden");
	}

	function showCardView() {
		els.setupSection.classList.add("hidden");
		els.cardSection.classList.remove("hidden");
	}

	function goHome() {
		resetCardView();
		showSetupView();
		showError("");
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	function updateCardChrome() {
		const total = state.players.length;
		const current = state.currentIndex + 1;
		els.playerProgress.textContent = `${current} / ${total}`;
		els.cardPlayerFront.textContent = `Pelaaja ${current}`;
		els.cardPlayer.textContent = `Pelaaja ${current}`;
		els.nextButton.textContent = current === total ? t("buttonDone") : t("buttonNext");
		resetCardView();
	}

	function revealCard() {
		const entry = state.players[state.currentIndex];
		const roleText = entry.role === "impostor" ? t("roleImpostor") : t("roleCrew");
		els.cardPlayer.textContent = `Pelaaja ${state.currentIndex + 1} - ${roleText}`;
		els.cardRole.textContent = "";
		els.cardWord.textContent = entry.role === "impostor" ? "" : entry.word;

		if (entry.role === "impostor" && state.useHint) {
			els.cardHint.textContent = `Vihje: ${entry.hint}`;
			els.cardHint.classList.remove("hidden");
		} else {
			els.cardHint.classList.add("hidden");
		}

		els.nextButton.classList.add("hidden");
		els.nextButton.disabled = true;

		els.card.classList.add("flipped");
		els.cardFrontMain.textContent = "Kortti on jo katsottu";
		els.cardFrontSub.textContent = "Anna laite seuraavalle pelaajalle";
		state.cardViewed = true;
	}

	function toggleCard() {
		if (els.card.classList.contains("flipped")) {
			els.card.classList.remove("flipped");
			if (state.cardViewed) {
				els.cardFrontMain.textContent = "Kortti on jo katsottu";
				els.cardFrontSub.textContent = "Anna laite seuraavalle pelaajalle";
				els.nextButton.classList.remove("hidden");
				els.nextButton.disabled = false;
			}
			return;
		}
		revealCard();
	}

	function nextPlayer() {
		const lastIndex = state.players.length - 1;
		if (state.currentIndex >= lastIndex) {
			finishRound();
			return;
		}
		state.currentIndex += 1;
		updateCardChrome();
	}

	function finishRound() {
		showSetupView();
		showError("");
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	function validateInput(playerCount, impostorCount, categories) {
		if (playerCount < 2 || playerCount > 20) return t("errorPlayersRange");
		if (impostorCount < 1 || impostorCount > 5) return t("errorImpostorRange");
		if (impostorCount >= playerCount) return t("errorImpostorVsPlayers");
		if (!categories.length) return t("errorNoCategory");
		return "";
	}

	function startGame(event) {
		event.preventDefault();
		showError("");

		const playerCount = parseInt(els.playerCount.value, 10);
		const impostorCount = parseInt(els.impostorCount.value, 10);
		const categories = collectSelectedCategories();
		const useHint = els.useHint.checked;

		const error = validateInput(playerCount, impostorCount, categories);
		if (error) {
			showError(error);
			return;
		}

		const pool = state.words.filter((w) => categories.includes(w.category));
		if (!pool.length) {
			showError(t("errorNoWord"));
			return;
		}

		const selection = pickRandom(pool);
		state.selectedWord = selection.word;
		state.selectedHint = selection.hint;
		state.selectedCategory = selection.category;
		state.useHint = useHint;

		const impostorIndexes = pickImpostorIndexes(impostorCount, playerCount);
		state.players = Array.from({ length: playerCount }, (_, idx) => {
			const isImpostor = impostorIndexes.includes(idx);
			return {
				role: isImpostor ? "impostor" : "crew",
				word: isImpostor ? null : state.selectedWord,
				hint: state.selectedHint,
				category: state.selectedCategory
			};
		});

		state.currentIndex = 0;
		showCardView();
		updateCardChrome();
	}

	function preventPullToRefresh() {
		let startY = 0;
		document.addEventListener(
			"touchstart",
			(e) => {
				startY = e.touches?.[0]?.clientY ?? 0;
			},
			{ passive: true }
		);

		document.addEventListener(
			"touchmove",
			(e) => {
				const currentY = e.touches?.[0]?.clientY ?? 0;
				const scrolledToTop = window.scrollY === 0;
				const pullingDown = currentY > startY;
				if (scrolledToTop && pullingDown) {
					e.preventDefault();
				}
			},
			{ passive: false }
		);
	}

	function bindEvents() {
		els.form.addEventListener("submit", startGame);
		els.card.addEventListener("click", toggleCard);
		els.nextButton.addEventListener("click", nextPlayer);
		els.appTitle.addEventListener("click", goHome);
	}

	function init() {
		bindEvents();
		preventPullToRefresh();
		showSetupView();
		loadWords();
	}

	init();
})();
