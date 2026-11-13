(() => {
  const MODULE_SOURCES = [
    'https://cdn.jsdelivr.net/npm/aladin-lite@3.8.2/dist/aladin.js',
    'https://unpkg.com/aladin-lite@3.8.2/dist/aladin.js'
  ];

  const CLASSIC_SOURCES = [
    'https://aladin.cds.unistra.fr/aladin_3.9.0-beta.js'
  ];

  const SURVEY_MIRRORS = [
    {
      url: 'https://skies.esac.esa.int/DSSColor',
      properties: 'https://skies.esac.esa.int/DSSColor/properties',
      label: 'DSS Color · ESA mirror'
    },
    {
      url: 'https://stpubdata.s3.us-east-1.amazonaws.com/mast/skybackgrounds/DSSColor',
      properties: 'https://stpubdata.s3.us-east-1.amazonaws.com/mast/skybackgrounds/DSSColor/properties',
      label: 'DSS Color · STScI mirror'
    },
    {
      url: 'https://casda.csiro.au/hips/DSS2/color',
      properties: 'https://casda.csiro.au/hips/DSS2/color/properties',
      label: 'DSS2 Color · CSIRO mirror'
    }
  ];

  const CHECK_TIMEOUT_MS = 3500;
  let readyPromise;

  async function loadModule(url) {
    const module = await import(url);
    const api = module.default || module.A;
    if (!api) throw new Error(`Aladin Lite module has no browser API: ${url}`);
    window.A = api;
  }

  function loadClassicScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.charset = 'utf-8';
      script.dataset.agnFieldAladinSource = url;
      script.onload = () => window.A
        ? resolve()
        : reject(new Error(`Aladin Lite loaded without its browser API: ${url}`));
      script.onerror = () => reject(new Error(`Could not load Aladin Lite: ${url}`));
      document.head.appendChild(script);
    });
  }

  async function ensureLibrary() {
    if (window.A) return;

    let lastError;
    for (const url of MODULE_SOURCES) {
      try {
        await loadModule(url);
        if (window.A) return;
      } catch (error) {
        lastError = error;
      }
    }

    for (const url of CLASSIC_SOURCES) {
      try {
        await loadClassicScript(url);
        if (window.A) return;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('No Aladin Lite source is available.');
  }

  async function surveyIsReachable(survey) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

    try {
      const response = await fetch(survey.properties, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
        signal: controller.signal
      });
      return response.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function chooseSurvey() {
    const checks = await Promise.all(SURVEY_MIRRORS.map(surveyIsReachable));
    const availableIndex = checks.findIndex(Boolean);
    return SURVEY_MIRRORS[availableIndex >= 0 ? availableIndex : 0];
  }

  async function ready() {
    if (!readyPromise) {
      readyPromise = (async () => {
        await ensureLibrary();
        await window.A.init;
        const survey = await chooseSurvey();
        return { A: window.A, survey };
      })();
    }
    return readyPromise;
  }

  window.AGNFieldAladin = {
    ready,
    surveys: SURVEY_MIRRORS.slice()
  };
})();
