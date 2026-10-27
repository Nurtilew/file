import { GoogleGenAI } from '@google/genai';

type Language = 'kk' | 'ru';
type ChatMessage = { role?: string; content?: string; text?: string };
type ImagePayload = { data?: string; mimeType?: string };

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };
const MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash'];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function normalizeHistory(history: unknown): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  if (!Array.isArray(history)) return [];
  const normalized: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  for (const item of history.slice(-12) as ChatMessage[]) {
    const text = String(item?.content ?? item?.text ?? '').trim().slice(0, 5000);
    if (!text) continue;
    const role: 'user' | 'model' = item.role === 'assistant' || item.role === 'model' ? 'model' : 'user';
    if (normalized.length === 0 && role === 'model') continue;
    const previous = normalized[normalized.length - 1];
    if (previous?.role === role) previous.parts[0].text += `\n${text}`;
    else normalized.push({ role, parts: [{ text }] });
  }
  return normalized;
}

function buildSystemInstruction(language: Language, mode: string, context: any): string {
  const user = context?.user && typeof context.user === 'object' ? context.user : {};
  const contracts = Array.isArray(context?.contracts) ? context.contracts.slice(0, 12) : [];
  const profileLines = [
    `Профиль/профиль дерегі: ${String(user.fullName || 'көрсетілмеген').slice(0, 100)}`,
    `Қолданбада көрсетілген баланс: ${Number.isFinite(Number(user.balance)) ? Number(user.balance).toLocaleString('kk-KZ') + ' ₸' : 'берілмеген'}`,
    `Кредиттік ұпай: ${Number.isFinite(Number(user.creditScore)) ? String(user.creditScore) : 'берілмеген'}`,
    `Дерек көзі: ${String(user.dataSource || 'қолданба профилі')}`,
    contracts.length
      ? `Қолданбада көрсетілген келісімдер: ${contracts.map((c: any) => `${String(c.productName || 'тауар')} — ${Number(c.totalAmount || 0).toLocaleString('kk-KZ')} ₸, ${c.isSigned ? 'қол қойылған деп белгіленген' : 'қол қойылмаған'}`).join('; ')}`
      : 'Келісімдер туралы дерек берілмеген.',
  ].join('\n');

  const modeInstruction = mode === 'legal'
    ? 'Заң/құқық режимі: құқықтық ақпаратты жалпы түсіндір; юрисдикцияны және шарт мәтінін нақтыла; ресми адвокат не заңгердің жеке қорытындысы ретінде көрсетпе.'
    : mode === 'finance'
      ? 'Қаржы режимі: арифметиканы тексер; белгісіз пайыз, комиссия, ЖТСМ/СЭСВ, нарықтық баға немесе мақұлдау ықтималдығын ойдан шығарма.'
      : mode === 'scoring'
        ? 'Скоринг режимі: кредиттік бюроға нақты қосылым жоқ болса, ресми скорингті немесе мақұлдау ықтималдығын білемін деп айтпа.'
        : 'Жалпы режим: кез келген жалпы тақырыптағы сұраққа тікелей көмектес.';

  if (language === 'ru') {
    return `Ты — QazaqFin AI, полезный многоязычный ассистент с естественным диалогом, близким к современным AI-чатам. Отвечай на языке последнего сообщения пользователя; если язык непонятен, используй русский (выбранный интерфейсом язык — запасной вариант). Отвечай именно на поставленный вопрос, учитывай контекст переписки, объясняй сложное простыми словами и задавай уточняющий вопрос только если без него нельзя ответить. Не подменяй ответ рекламой функций приложения и не повторяй один и тот же шаблон. Не выдумывай сведения, источники, цены, ставки или законы. Если не уверен — честно обозначь это.\n${modeInstruction}\nКонтекст приложения (данные профиля могут быть демонстрационными, это НЕ подтверждение реального банковского счёта):\n${profileLines}\nНе утверждай, что подключён к банкам, кредитным бюро, государственным базам или платёжным системам, если такого инструмента нет. Не называй демонстрационные OTP/подписи юридически значимыми и не гарантируй законность договора. Для юридических/финансовых вопросов объясняй ограничения и необходимость проверить действующие официальные условия. Для фото анализируй только видимое; не угадывай нечитаемые данные.`;
  }

  return `Сен — QazaqFin AI: қазіргі AI чаттар сияқты табиғи диалог жүргізетін, жан-жақты көмекші. Пайдаланушының соңғы хабарламасының тілінде жауап бер; тілін анықтау мүмкін болмаса, қазақшаны таңда (интерфейс тілі — қосалқы белгі). Нақты сұраққа тікелей жауап бер, алдыңғы хабарламаларды ескер, күрделі нәрсені қарапайым түсіндір. Қажет болмаса қарсы сұрақ қойма. Қолданба функцияларын жарнамалап, бір шаблонды қайталама. Заңды, бағаны, пайызды, дереккөзді немесе нақты фактіні ойдан шығарма; сенімсіз болсаң, оны ашық айт.\n${modeInstruction}\nҚолданба контексті (профильдегі сандар демонстрациялық болуы мүмкін, бұл НАҚТЫ банк шотының расталуы емес):\n${profileLines}\nНақты банктерге, кредиттік бюроға, мемлекеттік деректер базасына не төлем жүйесіне қосылғанмын деп айтпа, егер мұндай құрал берілмесе. Демо OTP/қолтаңбаны заңды күші бар деп жариялама және келісімшарттың заңдылығына кепілдік берме. Құқықтық/қаржылық сұрақта шектеулерді атап, қолданыстағы ресми талаптарды тексеруді ұсын. Суретті талдағанда тек көрінетін дерекке сүйен; оқылмайтын ақпаратты болжаушы болма.`;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error('AI_REQUEST_TIMEOUT')), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED', message: 'POST әдісі қажет.' }, 405);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'INVALID_JSON', message: 'Сұрау форматы жарамсыз.' }, 400);
  }

  const language: Language = body?.language === 'ru' ? 'ru' : 'kk';
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
  const image = body?.image as ImagePayload | undefined;
  if (!prompt && !image?.data) {
    return json({ error: 'PROMPT_REQUIRED', message: language === 'ru' ? 'Напишите вопрос или приложите изображение.' : 'Сұрақ жазыңыз немесе сурет тіркеңіз.' }, 400);
  }
  if (prompt.length > 12000) {
    return json({ error: 'PROMPT_TOO_LONG', message: language === 'ru' ? 'Сообщение слишком длинное. Сократите его и повторите.' : 'Хабарлама тым ұзын. Қысқартып, қайта жіберіңіз.' }, 413);
  }
  if (image?.data && image.data.length > 8_000_000) {
    return json({ error: 'IMAGE_TOO_LARGE', message: language === 'ru' ? 'Изображение слишком большое. Выберите файл меньшего размера.' : 'Сурет тым үлкен. Көлемі кішірек файл таңдаңыз.' }, 413);
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return json({
      error: 'AI_NOT_CONFIGURED',
      message: language === 'ru'
        ? 'AI-сервер ещё не настроен: добавьте GEMINI_API_KEY в переменные окружения Netlify и выполните повторный deploy.'
        : 'AI сервері бапталмаған: Netlify → Site configuration → Environment variables бөлімінде GEMINI_API_KEY қосып, қайта deploy жасаңыз.',
    }, 503);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const contents = normalizeHistory(body?.history);
    const finalParts: Array<Record<string, any>> = [];
    if (image?.data) {
      const cleanData = String(image.data).replace(/^data:[^;]+;base64,/, '');
      finalParts.push({ inlineData: { mimeType: image.mimeType || 'image/jpeg', data: cleanData } });
    }
    if (prompt) finalParts.push({ text: prompt });
    if (contents.length && contents[contents.length - 1].role === 'user') contents[contents.length - 1].parts.push(...finalParts as any[]);
    else contents.push({ role: 'user', parts: finalParts as any[] });

    const systemInstruction = buildSystemInstruction(language, String(body?.mode || 'general'), body?.userContext);
    let lastError: unknown;
    for (const model of MODELS) {
      try {
        const response = await withTimeout(ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            temperature: 0.65,
            maxOutputTokens: 2048,
          },
        }), 10000);
        const text = response?.text?.trim();
        if (text) return json({ text, model, timestamp: new Date().toISOString() });
        lastError = new Error('EMPTY_MODEL_RESPONSE');
      } catch (error) {
        lastError = error;
      }
    }

    const rawMessage = lastError instanceof Error ? lastError.message : '';
    const isQuota = /429|quota|resource.exhausted|rate.?limit/i.test(rawMessage);
    const isAuth = /401|403|api.?key|permission.denied|unauthenticated/i.test(rawMessage);
    const status = isQuota ? 429 : isAuth ? 503 : 502;
    const message = language === 'ru'
      ? isQuota
        ? 'Лимит Gemini API исчерпан или запросы слишком частые. Проверьте квоту и попробуйте позже.'
        : isAuth
          ? 'Gemini API не принял серверный ключ. Проверьте GEMINI_API_KEY и доступ к модели в настройках проекта.'
          : 'Gemini временно не смог ответить. Попробуйте ещё раз; фиктивный ответ вместо AI не подставляется.'
      : isQuota
        ? 'Gemini API лимиті таусылған немесе сұраныс тым жиі. Квотаны тексеріп, кейін қайталап көріңіз.'
        : isAuth
          ? 'Gemini серверлік кілтті қабылдамады. GEMINI_API_KEY мәнін және модельге қолжетімділікті тексеріңіз.'
          : 'Gemini уақытша жауап бере алмады. Қайта көріңіз; жүйе AI орнына ойдан шығарылған жауап бермейді.';
    return json({ error: isQuota ? 'AI_QUOTA_EXCEEDED' : isAuth ? 'AI_AUTH_FAILED' : 'AI_REQUEST_FAILED', message }, status);
  } catch (error) {
    console.error('QazaqFin Netlify AI function error:', error instanceof Error ? error.message : 'unknown error');
    return json({
      error: 'AI_REQUEST_FAILED',
      message: language === 'ru' ? 'Не удалось обработать запрос AI. Проверьте настройки сервера и повторите попытку.' : 'AI сұрауын өңдеу мүмкін болмады. Сервер баптауларын тексеріп, қайта көріңіз.',
    }, 502);
  }
};
