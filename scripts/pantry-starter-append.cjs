/**
 * One-off: merge pantry TSV into starter-ingredients.csv + print duplicate names vs existing file.
 * Run: node scripts/pantry-starter-append.cjs (only once; re-run after removing pantry block if needed)
 */
const fs = require('fs')
const path = require('path')

const CSV_PATH = path.join(__dirname, '../public/starter-ingredients.csv')

const RAW = `
Allspice	2	oz	$1.94
almond extract	2	oz	$3.62
almond flour	4	lb	$17.89
almond paste	7	oz	$6.16
almonds, sliced	2	oz	$1.42
almonds, whole	5	oz	$2.55
apple pie filling	21	oz	$2.97
apples, dried	16	oz	$6.59
apricots, dried	12	oz	$5.95
arrowroot	1	lb	$5.95
baking powder	624	gram	$5.12
baking soda	454	gram	$1.50
basil, dried	0.62	oz	$2.55
biscuit mix (Bisquick)	60	oz	$4.92
Blueberries, Freeze Dried	1	oz	$4.59
Bread Crumbs, Fresh	1	cup	$0.40
Bread Crumbs, Packaged	15	oz	$1.79
butter	1814.4	gram	$11.99
butter, unsalted	1814.4	gram	$11.99
Buttermilk	64	oz	$3.87
butterscotch chips	11	oz	$4.28
cake crumbs, fresh	1	cup	$1.00
Cake Mix - Betty/Duncan	1	box	$1.72
cardamom	51	gram	$5.46
cashews	30	oz	$13.88
celery seed	0.95	oz	$4.69
cereal, Rice Krispies	510	gram	$4.98
cheese, cheddar, grated	8	oz	$2.86
cheese, colby, grated	8	oz	$2.86
cheese, cottage	680	gram	$3.98
cheese, grated parmesan	8	oz	$3.39
cheese, jack, grated	8	oz	$2.86
cherry pie filling	850	gram	$5.12
chives, chopped dried	0.2	oz	$2.25
chives, chopped fresh	0.25	oz	$1.52
chocolate chips	2041	gram	$13.99
cinnamon	606	gram	$19.99
cloves, ground	57	gram	$2.08
cloves, whole	37	gram	$2.98
cocoa powder	700	gram	$12.79
coconut flour	1020	gram	$6.57
coconut, shredded	396	gram	$3.22
coffee, ground	793	gram	$20.24
coffee, instant-folgers	340	gram	$12.18
corn syrup	946	ml	$5.18
cornmeal	1.5	lb	$2.04
cornstarch	454	gram	$2.44
cranberries (dried)	1814	gram	$11.99
Cream Cheese	1358	gram	$7.89
Cream of Tartar	78	gram	$2.47
Cream of Wheat	28	oz	$4.04
currants	8	oz	$3.21
dates, chopped	8	oz	$3.79
Dehydrated Mini Marshmallows	85	gram	$1.58
egg whites (liquid)	2718	gram	$14.59
eggs	60	ea	$17.98
eggs (liquid, whole)	32	oz	$4.71
evaporated milk	12	oz	$1.84
farina	28	oz	$2.41
figs, dried	7	oz	$4.61
Flour, All Purpose	25	lb	$7.99
Flour, Bread	2268	gram	$3.93
flour, buckwheat	1.375	lb	$5.12
Flour, Cake	26	oz	$3.26
flour, potato	1.5	lb	$11.28
flour, rice	24	oz	$6.00
flour, rye	1.25	lb	$3.48
flour, self-rising	5	lb	$2.76
flour, semolina	24	oz	$10.00
Flour, Wheat	5	lb	$6.12
flour, whole wheat	5	lb	$4.08
garlic	1	tsp	$0.25
garlic, minced	48	oz	$10.39
Gel Food Color	21	gram	$2.70
gelatin	28	gram	$2.74
ginger, crystal	12	oz	$16.99
ginger, fresh	1	lb	$3.87
ginger, ground	43	gram	$2.24
graham cracker crumbs	1632	gram	$10.99
hazelnuts, whole	1	lb	$10.49
Heavy Cream	64	oz	$10.49
honey	2040	gram	$14.99
Jimmies, Rainbow	737	gram	$6.98
lard	1	lb	$1.79
Lemon Juice	443	ml	$1.88
lemon zest	1	tbsp	$0.58
margarine	16	oz	$1.11
Marshmallow creme	13	oz	$3.22
Marshmallows, Small	10	oz	$1.67
mayonnaise	20	oz	$5.37
meringue powder	16	oz	$26.70
milk, powdered	25.6	oz	$7.19
Milk, Whole	1856	gram	$5.26
molasses	12	oz	$3.94
mustard seed	1.4	oz	$2.86
mustard, dry	1.75	oz	$3.89
mustard, prepared	8	oz	$1.52
nutmeg	43	gram	$2.42
oatmeal, uncooked	42	oz	$5.12
oats, rolled	1	lb	$1.63
oats, steel-cut	24	oz	$2.04
olive oil	17	oz	$5.94
orange zest	1	tbsp	$0.77
oreo cookies	14.76	oz	$13.49
paprika	2.12	oz	$3.05
parsley, fresh	2	oz	$0.70
peanut butter	16	oz	$3.12
peanut butter chips-	10	oz	$3.12
peanuts, halved	16	oz	$2.58
peanuts, oil roasted	35	oz	$6.06
pecans, chopped	16	oz	$10.86
pignolias (pine nuts)	2	oz	$5.13
pistachio paste	8	oz	$25.25
poppy seeds	67	gram	$2.32
prunes	16	oz	$4.41
pumpkin, libby	15	oz	$2.22
raisins	20	oz	$4.38
Raspberries, Organic Freeze-Dried (Natierra)	1.25	oz	$4.59
rose water	2	oz	$9.75
saffron	0.01	oz	$4.62
salt-Kosher	48	oz	$3.67
sea salt (fine)	26	oz	$0.38
sea salt flakes, maldon	8.5	oz	$6.98
sesame seeds	2.4	oz	$2.05
shortening	48	oz	$8.08
sorghum flour	1.375	lb	$4.08
Sour Cream	14	oz	$2.84
spinach, cooked	10	oz	$1.01
strawberries	32	oz	$5.32
Strawberries, Freeze Dried	56	gram	$7.29
Sugar, Brown	3175.1	gram	$8.49
Sugar, Castor	500	gram	$12.99
Sugar, Granulated	4	lb	$2.02
Sugar, Powdered	7	lb	$5.50
sweet potatoes, raw	1.25	lb	$1.26
sweetened condensed milk	14	oz	$1.92
Tapioca Flour	16	oz	$3.07
turmeric, ground	0.95	oz	$2.76
Unsweetened Chocolate Baking Squares	4	oz	$2.16
vanilla	16	oz	$9.99
vanilla powder	1.1	oz	$7.19
vanilla wafers, crushed	11	oz	$3.74
vegetable oil	48	oz	$3.85
Vinegar	946	ml	$1.62
walnuts, chopped	2	oz	$1.22
walnuts, ground	6	oz	$3.07
walnuts, shelled	16	oz	$9.14
Water	1	cup	$0.00
wheat germ	20	oz	$5.55
White Chocolate Bars-Lindt	12	oz	$48.00
White Chocolate Chips, Ghirardelli	22	oz	$9.96
Wilton Fondant	5	lb	$19.44
yeast, active dry	4	oz	$5.48
`.trim()

function normPackUnit(u) {
  const x = String(u).toLowerCase().trim()
  if (x === 'gram') return 'g'
  if (x === 'ea') return 'each'
  return u
}

function recipeUnit(packUnit) {
  const u = String(packUnit).toLowerCase()
  if (u === 'ea' || u === 'each') return 'each'
  if (u === 'box') return 'each'
  if (u === 'cup') return 'cup'
  if (u === 'tbsp') return 'tbsp'
  if (u === 'tsp') return 'tsp'
  if (u === 'gram' || u === 'g') return 'g'
  if (u === 'ml') return 'ml'
  if (u === 'lb') return 'lb'
  if (u === 'oz') return 'oz'
  return 'oz'
}

function pickCategory(name) {
  const n = name.toLowerCase()
  if (/\bcoffee\b|\btea\b/.test(n)) return 'Other'
  if (/(^|[^a-z])flour|arrowroot|cornmeal|cornstarch|semolina|buckwheat|sorghum|tapioca|potato flour|rice flour|rye|whole wheat|self-rising|wheat germ|oatmeal|\boats\b|farina|cream of wheat|coconut flour/.test(n)) return 'Flour'
  if (/freeze-dried|freeze dried/.test(n)) return 'Fruit'
  if (/sugar|molasses|honey|jimmies|marshmallow|fondant|butterscotch|cranberries \(dried\)|raisins|dates|currants|prunes|figs/.test(n) && !n.includes('sweet potato')) return 'Sugar'
  if (/milk|cream|butter|cheese|buttermilk|yogurt|mayonnaise|sour cream|evaporated|condensed|margarine|lard|shortening/.test(n)) return 'Dairy'
  if (/^eggs|egg /.test(n)) return 'Eggs'
  if (/chocolate|cocoa|vanilla wafers|carob/.test(n)) return 'Chocolate'
  if (/baking powder|baking soda|yeast|cream of tartar/.test(n)) return 'Leavening'
  if (/extract|cinnamon|allspice|\bvanilla\b|nutmeg|ginger|cloves|cardamom|basil|chives|celery|paprika|turmeric|mustard|poppy|sesame|saffron|rose water|oregano|parsley|garlic|salt|pepper|lemon juice|lemon zest|orange zest/.test(n)) return 'Flavoring'
  if (/almonds|cashews|pecans|walnuts|peanuts|hazelnuts|pignolias|pistachio|pine nuts/.test(n)) return 'Nuts'
  if (/\boil\b|vinegar|\bjuice\b|water|corn syrup/.test(n)) return 'Oil/Fat'
  if (/apple pie|cherry pie|\bpumpkin|strawberries|blueberries|raspberries|spinach|parsley, fresh|apples, dried|apricots, dried/.test(n)) return 'Fruit'
  if (/gel food|food color|coloring/.test(n)) return 'Coloring'
  if (/cereal|krispies|biscuit mix|cake mix|oreo|graham/.test(n)) return 'Other'
  if (/cheese/.test(n)) return 'Dairy'
  return 'Other'
}

function escapeCsvField(s) {
  if (/[",\n]/.test(s)) return `"${String(s).replace(/"/g, '""')}"`
  return String(s)
}

function parseLines() {
  const lines = []
  for (const line of RAW.split('\n')) {
    const t = line.trim()
    if (!t || t.includes('Purchase Quantity')) continue
    const parts = t.split(/\t+/).filter(Boolean)
    if (parts.length < 4) continue
    const name = parts[0].replace(/peanut butter chips-$/, 'peanut butter chips').trim()
    const qty = parts[1]
    const pUnit = parts[2]
    const price = parseFloat(parts[3].replace(/^\$/, ''))
    if (Number.isNaN(price)) continue
    lines.push({ name, qty, pUnit, price })
  }
  return lines
}

function normalizeNameKey(s) {
  return s
    .toLowerCase()
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function main() {
  const parsed = parseLines()
  const csvContent = fs.readFileSync(CSV_PATH, 'utf8')
  const existingLines = csvContent.trimEnd().split('\n')
  const existingNames = new Set()
  for (let i = 1; i < existingLines.length; i++) {
    const m = existingLines[i].match(/^"?([^"]*)"?/)
    const name = m ? m[1].replace(/""/g, '"') : existingLines[i].split(',')[0]
    existingNames.add(normalizeNameKey(name))
  }

  const marker = 'Allspice,Flavoring,2,g,tsp,1.94'
  if (csvContent.includes(marker)) {
    console.log('Pantry block already present in CSV — aborting append. Delete those lines to re-run.')
    return
  }

  const newRows = []
  const dupVsStarter = []
  const seenNew = new Map()

  for (const row of parsed) {
    const key = normalizeNameKey(row.name)
    if (seenNew.has(key)) {
      console.warn('DUPLICATE_IN_NEW_LIST:', row.name, '↔', seenNew.get(key))
      continue
    }
    seenNew.set(key, row.name)

    if (existingNames.has(key)) dupVsStarter.push(row.name)

    const cat = pickCategory(row.name)
    const pu = normPackUnit(row.pUnit)
    const ru = recipeUnit(row.pUnit)
    const line = [
      escapeCsvField(row.name),
      cat,
      row.qty,
      pu,
      ru,
      row.price.toFixed(2),
    ].join(',')
    newRows.push(line)
  }

  const out = [...existingLines, ...newRows].join('\n') + '\n'
  fs.writeFileSync(CSV_PATH, out)

  console.log('Appended', newRows.length, 'rows to starter-ingredients.csv')
  console.log('\n--- Possible duplicates vs existing starter (same normalized name) ---')
  if (dupVsStarter.length === 0) console.log('(none detected)')
  else dupVsStarter.forEach((n) => console.log('•', n))
}

main()
