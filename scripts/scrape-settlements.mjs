import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const outputPath = path.join(repoRoot, 'src', 'data', 'settlements.generated.json');

const BASE_URL = 'https://topclassactions.com/wp-json/wp/v2';
const CATEGORY_ID = 18;
const USER_AGENT = 'ClassyPrototype/1.0 (+https://example.local)';

const STATE_NAMES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah',
  'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
];

const STOP_WORDS = new Set([
  'action', 'actions', 'agreed', 'benefits', 'breach', 'cash', 'class', 'claim', 'claims', 'data',
  'eligible', 'individuals', 'lawsuit', 'million', 'millions', 'open', 'people', 'proof', 'required',
  'settlement', 'settlements', 'state', 'states', 'their', 'they', 'this', 'those', 'through', 'with',
]);

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed request ${response.status} for ${url}`);
  }

  return response.json();
}

function stripHtml(value = '') {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#8230;/g, '...')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseFieldMap(renderedHtml) {
  const $ = cheerio.load(renderedHtml);
  const fieldMap = {};
  const paragraphs = [];

  $('p').each((_, node) => {
    const text = $(node).text().replace(/\s+/g, ' ').trim();
    if (text) {
      paragraphs.push(text);
    }
  });

  $('h6.wp-block-heading').each((_, heading) => {
    const key = $(heading).text().replace(/\s+/g, ' ').trim();
    const column = $(heading).closest('.wp-block-column');
    const siblingColumn = column.next('.wp-block-column');
    const value = siblingColumn.text().replace(/\s+/g, ' ').trim();

    if (key && value) {
      fieldMap[key] = value;
    }
  });

  return { fieldMap, paragraphs, $ };
}

function extractStates(...texts) {
  const joined = texts.join(' ').toLowerCase();
  return STATE_NAMES.filter((state) => joined.includes(state.toLowerCase()));
}

function extractKeywords(...texts) {
  const words = texts
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word));

  return [...new Set(words)].slice(0, 16);
}

function inferCategory(title, description) {
  const source = `${title} ${description}`.toLowerCase();

  if (source.includes('data breach')) {
    return 'Data breach';
  }
  if (source.includes('wage') || source.includes('employee') || source.includes('unpaid')) {
    return 'Employment';
  }
  if (source.includes('subscription')) {
    return 'Subscription';
  }
  if (source.includes('false advertising')) {
    return 'False advertising';
  }

  return 'General settlement';
}

function normalizeSettlement(post) {
  const rendered = post.content?.rendered ?? '';
  const { fieldMap, paragraphs, $ } = parseFieldMap(rendered);
  const description = stripHtml(post.yoast_head_json?.description ?? post.excerpt?.rendered ?? '');
  const eligibility = fieldMap['Who’s Eligible'] || fieldMap["Who's Eligible"] || paragraphs[1] || description;
  const stateTags = extractStates(fieldMap.Location ?? '', eligibility, description);
  const locationSummary =
    fieldMap.Location || (stateTags.length ? stateTags.join(', ') : 'Multi-state or not clearly specified');
  const notesSummary = paragraphs.slice(2, 5).join(' ') || 'Review the source article for the full claim details.';
  const keywordTags = extractKeywords(post.title.rendered, description, eligibility, locationSummary);
  const settlementWebsiteHeading = $('h6.wp-block-heading')
    .filter((_, node) => $(node).text().trim().toLowerCase() === 'settlement website')
    .first();
  const claimUrl =
    settlementWebsiteHeading.closest('.wp-block-column').next('.wp-block-column').find('a').attr('href') ?? null;

  return {
    id: post.slug,
    postId: post.id,
    title: stripHtml(post.title.rendered),
    slug: post.slug,
    sourceUrl: post.link,
    claimUrl,
    imageUrl: post.yoast_head_json?.og_image?.[0]?.url ?? null,
    category: inferCategory(post.title.rendered, description),
    description,
    publishedAt: post.date,
    deadline: fieldMap['Exclusion and Objection Deadline'] ?? fieldMap['Deadline to file a claim'] ?? null,
    deadlineLabel: fieldMap['Exclusion and Objection Deadline'] ?? fieldMap['Deadline to file a claim'] ?? null,
    finalHearing: fieldMap['Final Hearing'] ?? null,
    finalHearingLabel: fieldMap['Final Hearing'] ?? null,
    potentialAward: fieldMap['Potential Award'] ?? null,
    proofRequired: fieldMap['Proof of Purchase'] ?? null,
    totalSettlementAmount: fieldMap['Total Settlement Amount'] ?? null,
    eligibilitySummary: eligibility,
    locationSummary,
    notesSummary,
    stateTags,
    keywordTags,
  };
}

async function fetchAllPosts() {
  return fetchJson(
    `${BASE_URL}/posts?categories=${CATEGORY_ID}&page=1&per_page=100&_fields=id,date,slug,link,title,excerpt,content,yoast_head_json`,
  );
}

async function main() {
  const posts = await fetchAllPosts();
  const settlements = posts.map(normalizeSettlement);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(settlements, null, 2)}\n`);

  console.log(`Saved ${settlements.length} settlements to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
