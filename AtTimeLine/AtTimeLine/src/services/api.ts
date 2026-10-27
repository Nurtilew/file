import { UserProfile, Contract, AssistantMode } from '../types';

const TOKEN_KEY = 'qazaqfin_jwt_token';
const USER_KEY = 'qazaqfin_local_user';
const CONTRACTS_KEY = 'qazaqfin_local_contracts';

// In-memory fallback store when localStorage is restricted or blocked in sandboxed iframes
const memoryStore: Record<string, string> = {};

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // SecurityError / restricted iframe
    }
    return memoryStore[key] || null;
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // SecurityError / restricted iframe
    }
    memoryStore[key] = value;
  },
  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // SecurityError / restricted iframe
    }
    delete memoryStore[key];
  },
};

export const getAuthToken = (): string | null => {
  return safeStorage.getItem(TOKEN_KEY);
};

export const setAuthToken = (token: string): void => {
  safeStorage.setItem(TOKEN_KEY, token);
};

export const removeAuthToken = (): void => {
  safeStorage.removeItem(TOKEN_KEY);
};

const getHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Initial default demo user
export const getDefaultUser = (): UserProfile => {
  try {
    const stored = safeStorage.getItem(USER_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        return {
          id: String(parsed.id || 'user_demo_01'),
          email: String(parsed.email || 'demo@example.com'),
          fullName: String(parsed.fullName || 'Демо пайдаланушы'),
          iin: String(parsed.iin || '000000000000'),
          phone: String(parsed.phone || '+7 700 000 0000'),
          balance: typeof parsed.balance === 'number' && !isNaN(parsed.balance) ? parsed.balance : 450000,
          creditScore: typeof parsed.creditScore === 'number' && !isNaN(parsed.creditScore) ? parsed.creditScore : 755,
          createdAt: String(parsed.createdAt || new Date().toISOString()),
        };
      }
    }
  } catch {
    // ignore JSON parse error
  }

  const def: UserProfile = {
    id: 'user_demo_01',
    email: 'demo@example.com',
    fullName: 'Демо пайдаланушы',
    iin: '000000000000',
    phone: '+7 700 000 0000',
    balance: 450000,
    creditScore: 755,
    createdAt: new Date().toISOString(),
  };
  try {
    safeStorage.setItem(USER_KEY, JSON.stringify(def));
  } catch {
    // ignore
  }
  return def;
};

export const getLocalContracts = (): Contract[] => {
  try {
    const stored = safeStorage.getItem(CONTRACTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.map((c) => ({
          ...c,
          id: String(c.id || `KZ-${Date.now()}`),
          userId: String(c.userId || 'user_demo_01'),
          productName: String(c.productName || 'Тауар'),
          totalAmount: Number(c.totalAmount) || 0,
          type: (c.type === 'FULL_PAYMENT' ? 'FULL_PAYMENT' : 'CREDIT_INSTALLMENT') as 'FULL_PAYMENT' | 'CREDIT_INSTALLMENT',
          months: Number(c.months) || 12,
          monthlyPayment: Number(c.monthlyPayment) || 0,
          initialFee: Number(c.initialFee) || 0,
          isSigned: Boolean(c.isSigned),
          signedAt: c.signedAt ? String(c.signedAt) : undefined,
          signatureOtp: String(c.signatureOtp || '849201'),
          sellerName: String(c.sellerName || 'TOO "QazaqFin Store"'),
          sellerBin: String(c.sellerBin || '240140089123'),
          createdAt: String(c.createdAt || new Date().toISOString()),
        }));
      }
    }
  } catch {
    // ignore
  }

  const def: Contract[] = [
    {
      id: 'KZ-M8K29A-4819',
      userId: 'user_demo_01',
      productName: 'Apple iPhone 16 Pro Max 256GB Desert Titanium',
      totalAmount: 720000,
      type: 'CREDIT_INSTALLMENT',
      months: 12,
      monthlyPayment: 60000,
      initialFee: 0,
      isSigned: true,
      signedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      signatureOtp: '849201',
      digitalCertificate: 'EDS-KZ-000000000000-78B3F2AA9',
      sellerName: 'TOO "TechnoSmart Kazakhstan"',
      sellerBin: '200440029312',
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      id: 'KZ-L9P41X-7720',
      userId: 'user_demo_01',
      productName: 'Sony PlayStation 5 Slim 1TB + 2 DualSense',
      totalAmount: 299990,
      type: 'CREDIT_INSTALLMENT',
      months: 6,
      monthlyPayment: 49998,
      initialFee: 0,
      isSigned: false,
      signatureOtp: '419823',
      sellerName: 'TOO "QazaqFin Digital Store"',
      sellerBin: '240140089123',
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
  ];
  safeStorage.setItem(CONTRACTS_KEY, JSON.stringify(def));
  return def;
};

export const saveLocalContracts = (contracts: Contract[]) => {
  safeStorage.setItem(CONTRACTS_KEY, JSON.stringify(contracts));
};

export const saveLocalUser = (user: UserProfile) => {
  safeStorage.setItem(USER_KEY, JSON.stringify(user));
};

// Safe fetch with timeout to prevent hanging UI
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 6000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// Safe helper that attempts server fetch, but gracefully falls back if 404/timeout/static
async function tryServerFetch<T>(
  url: string,
  options: RequestInit,
  fallbackFn: () => Promise<T> | T
): Promise<T> {
  try {
    const res = await fetchWithTimeout(url, options, 5000);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      return await res.json();
    }
  } catch {
    // network, timeout or static host without backend
  }
  return await fallbackFn();
}

// Legacy browser-stored API keys are deliberately discarded. Public browser bundles
// must never hold the shared Gemini key; the serverless function reads it from env.
try {
  safeStorage.removeItem('qazaqfin_custom_api_key');
} catch {
  // Storage may be unavailable in a restricted browser context.
}

type AiLanguage = 'kk' | 'ru';
type AiHistoryMessage = { role: string; content: string };
type AiImage = { data: string; mimeType: string };

function buildAiUserContext() {
  const user = getDefaultUser();
  const contracts = getLocalContracts();
  return {
    user: {
      balance: user.balance,
      creditScore: user.creditScore,
      dataSource: 'local-demo-profile',
    },
    contracts: contracts.map((contract) => ({
      productName: contract.productName,
      totalAmount: contract.totalAmount,
      months: contract.months,
      monthlyPayment: contract.monthlyPayment,
      isSigned: contract.isSigned,
      createdAt: contract.createdAt,
    })),
  };
}

function getAiBackendUnavailableMessage(language: AiLanguage): string {
  const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.endsWith('github.io');
  if (language === 'ru') {
    return isGitHubPages
      ? 'Настоящий AI недоступен в этой статической версии GitHub Pages: там нет серверной функции. Чтобы ключ не попал в открытый код, разверните проект на Netlify и добавьте GEMINI_API_KEY в Site configuration → Environment variables, затем выполните повторный deploy.'
      : 'Не удалось связаться с AI-сервером. Проверьте подключение и настройки деплоя. Ключ Gemini должен храниться в переменной окружения сервера, а не в браузере.';
  }
  return isGitHubPages
    ? 'GitHub Pages-та тек статикалық бет жұмыс істейді, сондықтан ол нағыз AI серверін іске қоса алмайды. API кілтін кодқа ашық жазбаймыз. Жобаны Netlify-ге орналастырып, Site configuration → Environment variables ішінде GEMINI_API_KEY қосып, қайта deploy жасаңыз.'
    : 'AI серверіне қосыла алмадым. Интернет пен деплой баптауларын тексеріңіз. Gemini кілті браузерде емес, сервердің environment variables бөлімінде сақталуы керек.';
}

async function requestAi(payload: {
  prompt: string;
  history?: AiHistoryMessage[];
  language?: AiLanguage;
  mode?: AssistantMode;
  image?: AiImage;
}): Promise<{ text: string; model: string }> {
  const language = payload.language || 'kk';
  let response: Response;
  try {
    response = await fetchWithTimeout('/api/ai/chat', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        ...payload,
        userContext: buildAiUserContext(),
      }),
    }, 45000);
  } catch {
    throw new Error(getAiBackendUnavailableMessage(language));
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error(getAiBackendUnavailableMessage(language));
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new Error(language === 'ru'
      ? 'AI-сервер вернул некорректный ответ. Проверьте конфигурацию функции и повторите попытку.'
      : 'AI сервері жарамсыз жауап қайтарды. Функция баптауларын тексеріп, қайта көріңіз.');
  }

  if (!response.ok) {
    const message = typeof data?.message === 'string' ? data.message : typeof data?.error === 'string' ? data.error : '';
    throw new Error(message || (language === 'ru'
      ? `Ошибка AI-сервера (HTTP ${response.status}). Проверьте GEMINI_API_KEY и квоту API.`
      : `AI сервер қатесі (HTTP ${response.status}). GEMINI_API_KEY пен API лимитін тексеріңіз.`));
  }

  if (typeof data?.text !== 'string' || !data.text.trim()) {
    throw new Error(language === 'ru'
      ? 'AI вернул пустой ответ. Попробуйте сформулировать вопрос иначе.'
      : 'AI бос жауап қайтарды. Сұрақты басқаша құрастырып көріңіз.');
  }

  return { text: data.text, model: typeof data.model === 'string' ? data.model : 'gemini-3.8-flash' };
}

function parseReceiptResponse(text: string): {
  productName: string;
  totalAmount: number;
  sellerName: string;
  description: string;
} {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI чек деректерін JSON форматында қайтара алмады. Суретті анық түсіріп, қайта жүктеңіз.');

  let parsed: any;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    throw new Error('Чек деректерін оқу жауабының форматы қате. Суретті қайта жүктеп көріңіз.');
  }

  const productName = typeof parsed.productName === 'string' ? parsed.productName.trim() : '';
  const totalAmount = Number(parsed.totalAmount);
  if (!productName || !Number.isFinite(totalAmount) || totalAmount <= 0) {
    throw new Error('Чектен тауар атауы мен нақты соманы сенімді анықтай алмадым. Суретті анық түсіріңіз немесе деректерді қолмен енгізіңіз.');
  }

  return {
    productName,
    totalAmount,
    sellerName: typeof parsed.sellerName === 'string' && parsed.sellerName.trim() ? parsed.sellerName.trim() : 'Анықталмады',
    description: typeof parsed.description === 'string' ? parsed.description : '',
  };
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    return tryServerFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }, () => {
      const token = `jwt_token_${Date.now()}`;
      setAuthToken(token);
      const user = getDefaultUser();
      user.email = email || user.email;
      saveLocalUser(user);
      return {
        message: 'Жүйеге сәтті кірдіңіз!',
        token,
        user,
      };
    });
  },

  async register(payload: { email: string; password: string; fullName: string; iin: string; phone: string }) {
    return tryServerFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, () => {
      const token = `jwt_token_${Date.now()}`;
      setAuthToken(token);
      const newUser: UserProfile = {
        id: `user_${Date.now()}`,
        email: payload.email,
        fullName: payload.fullName || 'Демо пайдаланушы',
        iin: payload.iin || '000000000000',
        phone: payload.phone || '+7 700 000 0000',
        balance: 100000,
        creditScore: 740,
        createdAt: new Date().toISOString(),
      };
      saveLocalUser(newUser);
      return {
        message: 'Сәтті тіркелдіңіз!',
        token,
        user: newUser,
      };
    });
  },

  // Profile
  async getProfile(): Promise<UserProfile> {
    return tryServerFetch('/api/user/profile', {
      headers: getHeaders(),
    }, () => {
      return getDefaultUser();
    });
  },

  async updateProfile(payload: { fullName?: string; iin?: string; phone?: string }): Promise<UserProfile> {
    return tryServerFetch('/api/user/profile', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }, () => {
      const user = getDefaultUser();
      if (payload.fullName !== undefined) user.fullName = payload.fullName;
      if (payload.iin !== undefined) user.iin = payload.iin;
      if (payload.phone !== undefined) user.phone = payload.phone;
      saveLocalUser(user);
      return user;
    });
  },

  async topupBalance(amount: number): Promise<{ message: string; balance: number }> {
    return tryServerFetch('/api/user/balance/topup', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount }),
    }, () => {
      const user = getDefaultUser();
      user.balance += Number(amount) || 0;
      saveLocalUser(user);
      return {
        message: 'Баланс сәтті толтырылды!',
        balance: user.balance,
      };
    });
  },

  // AI Chat & Voice: all requests go through the server-side proxy.
  async sendChatMessage(
    prompt: string,
    history: Array<{ role: string; content: string }>,
    mode: AssistantMode,
    language: 'kk' | 'ru' = 'kk',
    image?: { data: string; mimeType: string }
  ): Promise<{ text: string; model: string }> {
    return requestAi({ prompt, history, mode, language, image });
  },

  async scanReceipt(image: { data: string; mimeType: string }): Promise<{
    productName: string;
    totalAmount: number;
    sellerName: string;
    description: string;
  }> {
    const response = await requestAi({
      prompt: `Суреттегі чек/ценниктен тауар деректерін оқы. Тек JSON қайтар, Markdown немесе түсіндірме қоспа. Белгісіз дерекке ойдан мән жазба; анықталмаған сатушы үшін "" пайдалан. Құрылым: {"productName":"тауар атауы","totalAmount":12345,"sellerName":"дүкен","description":"қысқаша сипаттама"}. Соманы тек суреттен анық оқылса сан ретінде бер.`,
      language: 'kk',
      history: [],
      image,
    });
    return parseReceiptResponse(response.text);
  },

  async getVoiceAudio(text: string, voiceName: string = 'Kore'): Promise<{ audioBase64: string; mimeType: string }> {
    return tryServerFetch('/api/ai/voice', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ text, voiceName }),
    }, () => {
      throw new Error('Fallback to WebSpeech');
    });
  },

  // Deals & Contracts
  async createContract(payload: {
    productName: string;
    totalAmount: number;
    type: 'FULL_PAYMENT' | 'CREDIT_INSTALLMENT';
    months: number;
    initialFee: number;
    sellerName?: string;
  }): Promise<{ message: string; contractId: string; contract: Contract; otpCode: string }> {
    return tryServerFetch('/api/deals/create-contract', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }, () => {
      const user = getDefaultUser();
      const numTotal = Number(payload.totalAmount);
      const numMonths = Math.max(1, Number(payload.months));
      const numInitial = Math.max(0, Number(payload.initialFee));
      const remainingToFinance = Math.max(0, numTotal - numInitial);
      const monthlyPayment = payload.type === 'CREDIT_INSTALLMENT' ? Math.round(remainingToFinance / numMonths) : 0;
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const contractId = `KZ-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newContract: Contract = {
        id: contractId,
        userId: user.id,
        productName: payload.productName,
        totalAmount: numTotal,
        type: payload.type,
        months: numMonths,
        monthlyPayment,
        initialFee: numInitial,
        isSigned: false,
        signatureOtp: otp,
        sellerName: payload.sellerName || 'TOO "TechnoSmart Kazakhstan"',
        sellerBin: '200440029312',
        createdAt: new Date().toISOString(),
      };

      const existing = getLocalContracts();
      saveLocalContracts([newContract, ...existing]);

      return {
        message: 'Келісімшарт жасалды! SMS OTP код арқылы цифрлық қол қойыңыз.',
        contractId: newContract.id,
        contract: newContract,
        otpCode: otp,
      };
    });
  },

  async signContract(contractId: string, otpCode: string): Promise<{ message: string; contract: Contract; certificate: string }> {
    return tryServerFetch('/api/deals/sign-contract', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ contractId, otpCode }),
    }, () => {
      const contracts = getLocalContracts();
      const contract = contracts.find((c) => c.id === contractId);
      if (!contract) throw new Error('Келісімшарт табылмады');

      if (contract.signatureOtp !== String(otpCode).trim()) {
        throw new Error('Қате OTP код! Қайталап көріңіз.');
      }

      const user = getDefaultUser();
      const digitalCertificate = `EDS-KZ-${user.iin}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      contract.isSigned = true;
      contract.signedAt = new Date().toISOString();
      contract.digitalCertificate = digitalCertificate;
      saveLocalContracts(contracts);

      // Boost credit score slightly
      user.creditScore = Math.min(850, user.creditScore + 5);
      saveLocalUser(user);

      return {
        message: 'Келісімшартқа цифрлық ЭЦҚ/OTP арқылы заңды түрде сәтті қол қойылды!',
        contract,
        certificate: digitalCertificate,
      };
    });
  },

  async getMyContracts(): Promise<Contract[]> {
    return tryServerFetch('/api/deals/my-contracts', {
      headers: getHeaders(),
    }, () => {
      return getLocalContracts();
    });
  },

  async analyzeDeal(payload: {
    productName: string;
    totalAmount: number;
    months: number;
    monthlyPayment: number;
  }): Promise<{ analysis: string }> {
    const response = await requestAi({
      language: 'kk',
      history: [],
      prompt: `Мына бөліп төлеу ұсынысын талда:
Тауар: ${payload.productName}
Бағасы: ${payload.totalAmount.toLocaleString('kk-KZ')} ₸
Мерзімі: ${payload.months} ай
Ай сайынғы төлем (қолданба есептеген): ${payload.monthlyPayment.toLocaleString('kk-KZ')} ₸

Есептің арифметикасын тексер. Жалпы артық төлем, комиссия, ЖТСМ/СЭСВ деректері берілмесе, 0% деп ойдан қорытынды жасама. Бекітілмеген ұсынысты банктің нақты мақұлдауы немесе заңгерлік қорытындысы ретінде көрсетпе. Артықшылықтарды, тәуекелдерді және келісімге дейін тексерілетін шарттарды қазақ тілінде қысқа әрі пайдалы түсіндір.`,
    });
    return { analysis: response.text };
  },
};
