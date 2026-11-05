/*
 * ⚠️ DRAFT CONTENT: the team must verify everything before presenting.
 *
 * Site list follows the 22 numbered sites of the National Heritage Board's
 * Civic District Heritage Trail (roots.gov.sg). Stories were drafted from
 * public sources and have NOT been fact-checked by the team. Check every
 * date, name and claim against roots.gov.sg / NLB Infopedia first.
 *
 * Coordinates were cross-checked against OpenStreetMap and point to a
 * public spot at or in front of each building. Sites that are very close
 * together use smaller geofence radii so their circles don't overlap much.
 *
 * Fields:
 *   number           official trail marker number (1–22)
 *   contentStatus    'full' (≈150-word, 60-second story) or 'coming soon'
 *   featured         one of the 6 fully written demo stops
 *   themes           any of: nationhood (Journey to Nationhood), functions
 *                    (Functions of the Civic District), fortunes (Seeking Fortunes,
 *                    Forging New Lives): the trail's three official storylines
 *   stepFree         approach has no unavoidable steps
 *   shaded           approach is mostly sheltered or tree-covered (team guess)
 *   spotThis         { detail, hint }: something physical to find on site
 *   stampIcon        emoji drawn on the passport stamp
 *   hue              colour used for the photo placeholder and the stamp
 */

export const STOPS = [
  // ───────────────────────── Fully written (6) ─────────────────────────
  {
    id: 'padang',
    number: 17,
    name: 'The Padang',
    shortName: 'Padang',
    lat: 1.29069,
    lng: 103.85303,
    geofenceRadiusM: 70,
    themes: ['nationhood', 'functions'],
    stepFree: true,
    shaded: false,
    contentStatus: 'full',
    featured: true,
    stampIcon: '🏏',
    hue: 140,
    story:
      "Padang means \"field\" or \"plain\" in Malay, and this open green is one of Singapore's oldest public spaces. Raffles's town plan of 1822 kept it free of buildings, and it has been the town's stage ever since.\n\n" +
      'Cricket was being played here by the mid-1800s. The Singapore Cricket Club, founded in 1852, sits at one end of the field. The Singapore Recreation Club, set up in 1883 by the Eurasian community, stands at the other.\n\n' +
      'The Padang has seen darker days too. In February 1942, after the British surrender, the Japanese assembled European civilians here before marching them off to internment.\n\n' +
      "After the war it became the place where the nation celebrated itself. Singapore's first National Day Parade was held here in 1966, and the Padang has hosted many parades since, including the Golden Jubilee in 2015. In 2022 it was gazetted as a National Monument.",
    spotThis: {
      detail: 'Two clubhouses facing each other across the field: the Singapore Cricket Club and the Singapore Recreation Club.',
      hint: 'Stand at the edge of the field and look along its length, one club at each end.',
    },
    arCaption: "1966: Singapore's first National Day Parade marched across this field.",
  },
  {
    id: 'city-hall-supreme-court',
    number: 5,
    name: 'Former City Hall & Supreme Court',
    shortName: 'City Hall & Supreme Court',
    lat: 1.2903,
    lng: 103.8518,
    geofenceRadiusM: 50,
    themes: ['nationhood', 'functions'],
    stepFree: true,
    shaded: true,
    contentStatus: 'full',
    featured: true,
    stampIcon: '🏛️',
    hue: 30,
    story:
      'These two grand buildings now form National Gallery Singapore. For most of the 20th century they were the seat of government and justice.\n\n' +
      'The Municipal Building was finished in 1929 and renamed City Hall in 1951, when Singapore was granted city status. On 12 September 1945, Japanese forces in Southeast Asia formally surrendered here to Lord Louis Mountbatten, ending three and a half years of occupation. Crowds gathered outside to celebrate.\n\n' +
      "The steps facing the Padang later saw milestones of nationhood. In 1959, Singapore's first fully elected government was sworn in at City Hall. In 1963, Lee Kuan Yew proclaimed Singapore's merger with Malaysia from these steps.\n\n" +
      'Next door, the former Supreme Court, completed in 1939, is often described as the last classical-style building put up in Singapore. The two were linked and reopened as the National Gallery in 2015.',
    spotThis: {
      detail: "The row of tall Corinthian columns across City Hall's front: look for the leafy, scroll-topped capitals.",
      hint: "Count the columns along the side facing the Padang, then find the Supreme Court's green dome next door.",
    },
    arCaption: '12 Sep 1945: Japanese surrender signed inside. 1959 and 1963: milestones of self-rule on these steps.',
  },
  {
    id: 'old-parliament',
    number: 9,
    name: 'Former Parliament House (The Arts House)',
    shortName: 'Old Parliament House',
    lat: 1.2885,
    lng: 103.85085,
    geofenceRadiusM: 30,
    themes: ['nationhood', 'functions'],
    stepFree: true,
    shaded: true,
    contentStatus: 'full',
    featured: true,
    stampIcon: '🐘',
    hue: 45,
    story:
      "This is probably Singapore's oldest surviving building. It was designed in 1827 by George Drumgoole Coleman as a home for a Scottish merchant, John Argyle Maxwell. Maxwell never moved in. Instead he leased it to the colonial government, which turned it into a courthouse and later bought it outright.\n\n" +
      "Over the next century the building kept growing, with new wings added as the town's legal work expanded. When the courts moved out, it became government offices. In the 1950s it was refitted to house Singapore's partly elected legislature.\n\n" +
      'After independence in 1965 it became Parliament House, where the laws of the new nation were debated for more than three decades. In 1999 Parliament moved into the new building next door. This one reopened in 2004 as The Arts House, a home for literature, film and music.',
    spotThis: {
      detail: 'A bronze elephant on a tall pedestal: a gift from King Chulalongkorn of Siam after his visit to Singapore in 1871.',
      hint: 'Look in front of The Arts House, and read the pedestal for the inscription recording the visit.',
    },
    arCaption: "From merchant's house (1827) to courthouse to Parliament House: the laws of a new nation were debated here.",
  },
  {
    id: 'victoria',
    number: 18,
    name: 'Victoria Theatre & Victoria Concert Hall',
    shortName: 'Victoria Theatre',
    lat: 1.28855,
    lng: 103.8514,
    geofenceRadiusM: 30,
    themes: ['nationhood', 'functions'],
    stepFree: true,
    shaded: false,
    contentStatus: 'full',
    featured: true,
    stampIcon: '🕰️',
    hue: 210,
    story:
      "Two buildings, one clock tower. Singapore's oldest performing arts venue began as the Town Hall, completed in 1862, where the colonial community held meetings, balls and amateur plays.\n\n" +
      'When Queen Victoria died in 1901, the town raised money for a memorial. The Victoria Memorial Hall was built beside the Town Hall and opened in 1905, with a clock tower joining the two. The old Town Hall was later renamed Victoria Theatre.\n\n' +
      "The halls also played a part in the story of nationhood. In November 1954, the People's Action Party was inaugurated at a meeting in Victoria Memorial Hall. That party would go on to lead Singapore into self-government and independence.\n\n" +
      'Around 1980 the memorial hall became Victoria Concert Hall, home of the Singapore Symphony Orchestra. After a major restoration, both halls reopened in 2014, with their historic facades kept and the insides modernised.',
    spotThis: {
      detail: 'The clock tower that joins the two halls, completed in 1906, a year after the memorial hall opened.',
      hint: 'Step back towards Empress Place and look up where the two buildings meet.',
    },
    arCaption: '1862 Town Hall + 1905 Memorial Hall, joined by a clock tower: Singapore’s oldest performing arts venue.',
  },
  {
    id: 'empress-place',
    number: 2,
    name: 'Asian Civilisations Museum (Former Empress Place Building)',
    shortName: 'Asian Civilisations Museum',
    lat: 1.28745,
    lng: 103.8516,
    geofenceRadiusM: 35,
    themes: ['nationhood', 'functions', 'fortunes'],
    stepFree: true,
    shaded: true,
    contentStatus: 'full',
    featured: true,
    stampIcon: '🏺',
    hue: 15,
    story:
      "Built between 1864 and 1867 as a courthouse, this was one of the colonial government's most important buildings. As the government grew, so did the building, with new wings added in stages over the following decades, all in a matching neoclassical style. In 1907 the area was named Empress Place, after Queen Victoria, who was also Empress of India.\n\n" +
      'For many Singaporeans this building is tied to a very personal milestone. It housed government departments such as the Registry of Births and Deaths and the immigration and citizenship offices. Many people came here to register a birth, apply for a passport, or become a citizen of the new nation.\n\n' +
      'After restoration it opened as the Empress Place Museum in 1989. Since 2003 it has been home to the Asian Civilisations Museum, telling the stories of the many cultures that shaped Singapore.',
    spotThis: {
      detail: 'On Cavenagh Bridge next door, an old police notice banning cattle and horses from crossing.',
      hint: 'Check the ends of the white suspension bridge beside the museum. The sign is cast in metal.',
    },
    arCaption: 'Courthouse (1867) → government offices → museum. Generations registered as citizens here.',
  },
  {
    id: 'esplanade-park',
    number: 3,
    name: 'Esplanade Park (Cenotaph & Lim Bo Seng Memorial)',
    shortName: 'Esplanade Park',
    lat: 1.28945,
    lng: 103.8535,
    geofenceRadiusM: 70,
    themes: ['nationhood', 'fortunes'],
    stepFree: true,
    shaded: true,
    contentStatus: 'full',
    featured: true,
    stampIcon: '🕊️',
    hue: 160,
    story:
      "This waterfront park sits on land reclaimed from the sea. Its tree-lined path, Queen Elizabeth Walk, was named in 1953 to mark the Queen's coronation.\n\n" +
      'Look for two memorials. The Cenotaph remembers the men from Singapore who died in the First World War; its foundation stone was laid in 1922 by the Prince of Wales. After the Second World War, the years 1939–1945 were added to honour those lost in that conflict too.\n\n' +
      "Nearby stands the Lim Bo Seng Memorial, unveiled in 1954. Lim Bo Seng was a businessman who joined the resistance against the Japanese with Force 136, a British-led underground unit. He was captured and died in prison in 1944, and is remembered as one of Singapore's war heroes.\n\n" +
      'Today the park is a quiet place for a stroll, with the Tan Kim Seng Fountain, dating from 1882, at its northern end.',
    spotThis: {
      detail: 'The Lim Bo Seng Memorial: an eight-sided pagoda guarded by four bronze lions.',
      hint: 'Walk south along Queen Elizabeth Walk from the Cenotaph, towards the river.',
    },
    arCaption: 'Remembering those lost in two World Wars, and Lim Bo Seng, resistance hero (1909–1944).',
  },

  // ─────────────────────── Coming soon (16 more) ───────────────────────
  {
    id: 'armenian-church',
    number: 1,
    name: 'Armenian Apostolic Church of St Gregory the Illuminator',
    shortName: 'Armenian Church',
    lat: 1.29311,
    lng: 103.84939,
    geofenceRadiusM: 35,
    themes: ['fortunes', 'functions'],
    stepFree: false,
    shaded: true,
    contentStatus: 'coming soon',
    stampIcon: '⛪',
    hue: 0,
    story:
      "Completed in 1835 and consecrated in 1836, this is Singapore's oldest Christian church building, designed by George Drumgoole Coleman for the small but influential Armenian community. In its garden lies the tombstone of Agnes Joaquim, who bred the orchid later chosen as Singapore's national flower, Vanda Miss Joaquim.",
    spotThis: { detail: "Agnes Joaquim's tombstone in the church's memorial garden.", hint: 'Walk around the side of the church into the garden.' },
    arCaption: "1835: Singapore's oldest Christian church building.",
  },
  {
    id: 'fort-canning',
    number: 4,
    name: 'Fort Canning Park',
    shortName: 'Fort Canning',
    lat: 1.29402,
    lng: 103.84601,
    geofenceRadiusM: 80,
    themes: ['functions'],
    stepFree: false,
    shaded: true,
    contentStatus: 'coming soon',
    stampIcon: '🌳',
    hue: 120,
    story:
      'Once known as Bukit Larangan, the "Forbidden Hill", this was believed to be the resting place of ancient Malay kings. Raffles built a house on the hill, and the British later built a fort here. During the Second World War an underground bunker, the Battlebox, served as a British command centre. It was here that the decision to surrender was made in February 1942.',
    spotThis: { detail: 'Fort Gate, one of the last surviving parts of the 19th-century fort.', hint: 'Follow the park signs to Fort Gate.' },
    arCaption: 'Forbidden Hill → colonial fort → wartime command bunker.',
  },
  {
    id: 'national-museum',
    number: 6,
    name: 'National Museum of Singapore',
    shortName: 'National Museum',
    lat: 1.29655,
    lng: 103.84832,
    geofenceRadiusM: 60,
    themes: ['functions'],
    stepFree: true,
    shaded: true,
    contentStatus: 'coming soon',
    stampIcon: '🖼️',
    hue: 260,
    story:
      "Completed in 1887 as the purpose-built home of the Raffles Library and Museum, this is Singapore's oldest museum. During the Japanese Occupation it was renamed the Syonan Museum. Its dome, lined with stained glass, is one of the city's best-loved landmarks.",
    spotThis: { detail: 'The museum’s dome, crowning the front of the building.', hint: 'Stand across Stamford Road and look up.' },
    arCaption: "1887: Singapore's oldest museum.",
  },
  {
    id: 'hill-street-police',
    number: 7,
    name: 'Former Hill Street Police Station',
    shortName: 'Hill Street Police Station',
    lat: 1.29085,
    lng: 103.8485,
    geofenceRadiusM: 40,
    themes: ['functions'],
    stepFree: true,
    shaded: true,
    contentStatus: 'coming soon',
    stampIcon: '🚓',
    hue: 290,
    story:
      'Completed in 1934, this was the largest government building of its time, with offices, cells and barracks where police officers lived with their families. Today it is famous for its many windows, their shutters painted in bright rainbow colours.',
    spotThis: { detail: 'The rainbow-coloured window shutters.', hint: 'Look up at the facade from across Hill Street.' },
    arCaption: '1934: once the largest government building in Singapore.',
  },
  {
    id: 'st-andrews',
    number: 8,
    name: "St Andrew's Cathedral",
    shortName: "St Andrew's Cathedral",
    lat: 1.29231,
    lng: 103.85231,
    geofenceRadiusM: 50,
    themes: ['functions'],
    stepFree: true,
    shaded: true,
    contentStatus: 'coming soon',
    stampIcon: '✝️',
    hue: 220,
    story:
      "Consecrated in 1862, this is Singapore's oldest surviving Anglican place of worship, built in the Gothic Revival style with Indian convict labour. Its walls were finished with Madras chunam, a plaster said to be mixed with egg white, sugar and coconut husk. In February 1942 it was used as an emergency hospital.",
    spotThis: { detail: 'The smooth, bright white walls finished in Madras chunam.', hint: 'Look closely at the walls near the entrance.' },
    arCaption: "1862: Singapore's oldest surviving Anglican church.",
  },
  {
    id: 'capitol',
    number: 10,
    name: 'Capitol Theatre, Former Namazie Mansions & Former Stamford House',
    shortName: 'Capitol Theatre',
    lat: 1.2933,
    lng: 103.8511,
    geofenceRadiusM: 45,
    themes: ['functions', 'fortunes'],
    stepFree: true,
    shaded: true,
    contentStatus: 'coming soon',
    stampIcon: '🎭',
    hue: 340,
    story:
      'Three early-to-mid 20th-century buildings now form one restored development. Capitol Theatre opened in 1930 and was once considered among the largest cinemas in the East, a place where generations of Singaporeans watched films and shows.',
    spotThis: { detail: 'The CAPITOL lettering above the theatre entrance.', hint: 'Look up at the corner of Stamford Road and North Bridge Road.' },
    arCaption: '1930: one of the grandest cinemas in the East.',
  },
  {
    id: 'armenian-street',
    number: 11,
    name: 'Armenian Street',
    shortName: 'Armenian Street',
    lat: 1.29369,
    lng: 103.8491,
    geofenceRadiusM: 30,
    themes: ['fortunes'],
    stepFree: true,
    shaded: true,
    contentStatus: 'coming soon',
    stampIcon: '🛣️',
    hue: 25,
    story:
      'One of the oldest streets in Singapore, Armenian Street existed by 1836 and takes its name from the Armenian Church nearby. It is lined with historic buildings, including a former school and a former publishing house.',
    spotThis: { detail: 'The covered five-foot way in front of the old shophouses.', hint: 'Walk along the street and look at the shopfronts.' },
    arCaption: 'By 1836: one of Singapore’s oldest streets.',
  },
  {
    id: 'methodist-publishing',
    number: 12,
    name: 'Former Methodist Publishing House',
    shortName: 'Methodist Publishing House',
    lat: 1.29462,
    lng: 103.8497,
    geofenceRadiusM: 30,
    themes: ['fortunes'],
    stepFree: true,
    shaded: false,
    contentStatus: 'coming soon',
    stampIcon: '📚',
    hue: 5,
    story:
      'A three-storey Edwardian-style building completed in 1908 by the Methodist mission for its printing arm. The business was later sold and became the well-known MPH bookshop, which operated here until 2003.',
    spotThis: { detail: 'The ornate corner facade facing the Stamford Road junction.', hint: 'Find the corner of Stamford Road and Armenian Street.' },
    arCaption: '1908: printing presses, then a beloved bookshop.',
  },
  {
    id: 'tao-nan',
    number: 13,
    name: 'Former Tao Nan School (Peranakan Museum)',
    shortName: 'Former Tao Nan School',
    lat: 1.29429,
    lng: 103.84911,
    geofenceRadiusM: 30,
    themes: ['fortunes', 'functions'],
    stepFree: true,
    shaded: true,
    contentStatus: 'coming soon',
    stampIcon: '🏫',
    hue: 180,
    story:
      'Tao Nan School was established in 1906 by a group of Hokkien merchants and moved into this building in 1912. The school later moved to Marine Parade, and the building is now home to the Peranakan Museum.',
    spotThis: { detail: 'The building’s symmetrical front with tall arched windows.', hint: 'Stand across Armenian Street for the best view.' },
    arCaption: '1906: a school founded by Hokkien merchants.',
  },
  {
    id: 'al-burhani',
    number: 14,
    name: 'Masjid Al-Burhani',
    shortName: 'Masjid Al-Burhani',
    lat: 1.2935,
    lng: 103.8503,
    geofenceRadiusM: 25,
    themes: ['fortunes'],
    stepFree: true,
    shaded: false,
    contentStatus: 'coming soon',
    stampIcon: '🕌',
    hue: 100,
    story:
      "The spiritual home of Singapore's Dawoodi Bohra community, a Muslim community with roots in western India. The mosque's origins on this site date back to 1897.",
    spotThis: { detail: 'The mosque’s entrance along Hill Street.', hint: 'Walk along Hill Street towards Stamford Road.' },
    arCaption: 'Since 1897: home of the Dawoodi Bohra community.',
  },
  {
    id: 'sccci',
    number: 15,
    name: 'Singapore Chinese Chamber of Commerce & Industry',
    shortName: 'Chinese Chamber of Commerce',
    lat: 1.29305,
    lng: 103.85018,
    geofenceRadiusM: 25,
    themes: ['fortunes', 'nationhood'],
    stepFree: true,
    shaded: true,
    contentStatus: 'coming soon',
    stampIcon: '🏮',
    hue: 355,
    story:
      'Founded in 1906 to represent Chinese business interests and liaise with the Chinese and British governments. After the war the Chamber led efforts to recover the remains of civilians killed during the Japanese Occupation, work that led to the Civilian War Memorial.',
    spotThis: { detail: 'The traditional Chinese-style gateway at the entrance.', hint: 'Face the building from Hill Street.' },
    arCaption: '1906: a voice for Chinese merchants in Singapore.',
  },
  {
    id: 'fullerton',
    number: 16,
    name: 'Former Fullerton Building',
    shortName: 'Fullerton Building',
    lat: 1.2862,
    lng: 103.85307,
    geofenceRadiusM: 50,
    themes: ['functions', 'nationhood'],
    stepFree: true,
    shaded: true,
    contentStatus: 'coming soon',
    stampIcon: '✉️',
    hue: 40,
    story:
      "Completed in 1928 and named after Robert Fullerton, the first Governor of the Straits Settlements, it housed the General Post Office, government offices, a chamber of commerce and the Singapore Club. Fullerton Square, out front, was a popular venue for lunchtime political rallies in the decades after the war. Today it is The Fullerton Hotel.",
    spotThis: { detail: 'The row of giant columns along the river-facing side.', hint: 'Look across from Cavenagh Bridge.' },
    arCaption: '1928: the General Post Office, now a landmark hotel.',
  },
  {
    id: 'raffles-statue',
    number: 19,
    name: 'Sir Stamford Raffles Statue',
    shortName: 'Raffles Statue',
    lat: 1.28813,
    lng: 103.85192,
    geofenceRadiusM: 30,
    themes: ['nationhood'],
    stepFree: true,
    shaded: false,
    contentStatus: 'coming soon',
    stampIcon: '🗿',
    hue: 200,
    story:
      'This bronze statue by Thomas Woolner was unveiled on the Padang in 1887 and moved here in 1919, Singapore’s centenary year. During the Japanese Occupation it was moved into the museum, and it returned to this spot after the war.',
    spotThis: { detail: 'The bronze statue, arms folded, in front of Victoria Concert Hall.', hint: 'Look for it on Empress Place.' },
    arCaption: '1887: bronze statue by Thomas Woolner.',
  },
  {
    id: 'central-fire',
    number: 20,
    name: 'Central Fire Station',
    shortName: 'Central Fire Station',
    lat: 1.29214,
    lng: 103.84872,
    geofenceRadiusM: 30,
    themes: ['functions'],
    stepFree: true,
    shaded: false,
    contentStatus: 'coming soon',
    stampIcon: '🚒',
    hue: 8,
    story:
      "Completed in 1909, this is Singapore's oldest surviving fire station. Its red brick and white plaster bands are often called the \"blood and bandage\" style. Its tall tower was once used as a lookout for fires across the town.",
    spotThis: { detail: 'The red-and-white striped lookout tower.', hint: 'Look up from Hill Street.' },
    arCaption: "1909: Singapore's oldest surviving fire station.",
  },
  {
    id: 'masonic-hall',
    number: 21,
    name: 'Masonic Hall',
    shortName: 'Masonic Hall',
    lat: 1.29257,
    lng: 103.84895,
    geofenceRadiusM: 24,
    themes: ['fortunes'],
    stepFree: false,
    shaded: false,
    contentStatus: 'coming soon',
    stampIcon: '📐',
    hue: 240,
    story:
      "Home to Singapore's Freemasons, the Masonic Hall was officially opened in 1879. Its classical facade is one of the Civic District's quieter architectural gems.",
    spotThis: { detail: 'Masonic symbols on the building’s facade.', hint: 'Look above the entrance on Coleman Street.' },
    arCaption: '1879: home of Singapore’s Freemasons.',
  },
  {
    id: 'former-acs',
    number: 22,
    name: 'Former Anglo-Chinese School',
    shortName: 'Former Anglo-Chinese School',
    lat: 1.29295,
    lng: 103.84865,
    geofenceRadiusM: 30,
    themes: ['functions', 'fortunes'],
    stepFree: true,
    shaded: true,
    contentStatus: 'coming soon',
    stampIcon: '🎓',
    hue: 60,
    story:
      "Founded by the Methodists in 1886, Anglo-Chinese School moved to Coleman Street the same year. One of its buildings became the Singapore Philatelic Museum in 1995 and is now the Children's Museum Singapore. A later wing houses the National Archives of Singapore.",
    spotThis: { detail: "The Children's Museum Singapore building on Coleman Street.", hint: 'Walk up Coleman Street towards Canning Rise.' },
    arCaption: '1886: a Methodist school for boys.',
  },
];

export const STOPS_BY_ID = Object.fromEntries(STOPS.map((s) => [s.id, s]));
export const FEATURED_STOPS = STOPS.filter((s) => s.featured);
