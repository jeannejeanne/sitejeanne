// Catalogue de recettes saines. Format compact :
// [nom, emoji, minutes, kcal/portion, protéines g, 'tags', 'ingrédient:quantité;…', 'étape / étape / …']
// Tags : prot rapide masse seche vege petitdej post sucre portugais batch eco
// Un ingrédient précédé de * est un basique du placard (sel, huile…) : il ne compte pas comme « manquant ».
export const RAW = [
  // ---------- Petits-déjeuners ----------
  ['Overnight oats protéinés', '🥣', 5, 520, 35, 'petitdej prot rapide masse eco', "flocons d'avoine:70 g;skyr:150 g;lait:150 ml;banane:1;beurre de cacahuète:1 c. à s.;*cannelle:1 pincée", "Mélange avoine, skyr et lait dans un bocal / Ajoute la cannelle, ferme et laisse une nuit au frigo / Le matin, ajoute la banane en rondelles et le beurre de cacahuète"],
  ['Omelette épinards & feta', '🍳', 10, 380, 28, 'petitdej prot rapide seche vege', 'oeufs:3;épinards:1 poignée;feta:40 g;tomate:1;*huile d\'olive:1 c. à c.;*sel;*poivre', "Fais tomber les épinards 1 min à la poêle avec un filet d'huile / Verse les œufs battus salés-poivrés / Ajoute feta émiettée et tomate en dés, plie l'omelette quand c'est pris"],
  ['Pancakes banane-avoine', '🥞', 15, 450, 26, 'petitdej sucre prot vege eco', "banane:1;oeufs:2;flocons d'avoine:50 g;skyr:100 g;fruits rouges:1 poignée;*cannelle", 'Mixe banane, œufs, avoine et cannelle / Cuis de petits pancakes 2 min par face à feu moyen / Sers avec le skyr et les fruits rouges'],
  ['Tartines avocat & œufs', '🥑', 10, 480, 22, 'petitdej rapide vege', 'pain complet:2 tranches;avocat:1/2;oeufs:2;citron:1/2;*piment:1 pincée;*sel', "Fais griller le pain / Écrase l'avocat avec citron, sel et piment / Ajoute des œufs mollets (6 min dans l'eau bouillante) ou au plat"],
  ['Bowl skyr, granola & fruits', '🍓', 3, 400, 30, 'petitdej rapide sucre prot vege', 'skyr:250 g;granola:40 g;fruits rouges:1 poignée;miel:1 c. à c.', 'Verse le skyr dans un bol / Ajoute granola, fruits et un filet de miel'],
  ['Smoothie post-training cacao', '🥤', 3, 480, 38, 'post rapide sucre prot masse', "lait:300 ml;whey:1 dose;banane:1;flocons d'avoine:30 g;cacao:1 c. à s.", 'Mets tout dans le blender / Mixe 30 s et bois dans l\'heure après la séance'],
  ['Porridge pomme-cannelle', '🍎', 8, 430, 18, 'petitdej eco vege sucre', "flocons d'avoine:60 g;lait:250 ml;pomme:1;noix:15 g;*cannelle", "Fais cuire l'avoine dans le lait 4–5 min en remuant / Ajoute la pomme râpée et la cannelle / Parsème de noix concassées"],
  ['Wrap œufs brouillés & dinde', '🌯', 10, 520, 40, 'petitdej prot rapide masse', 'tortilla:1;oeufs:3;jambon de dinde:2 tranches;fromage râpé:20 g;*sel', "Brouille les œufs à feu doux / Garnis la tortilla de dinde, œufs et fromage / Roule et passe 1 min à la poêle"],
  // ---------- Plats protéinés ----------
  ['Poulet teriyaki & riz', '🍗', 25, 650, 48, 'prot masse post batch', 'poulet:180 g;riz:80 g;sauce soja:2 c. à s.;miel:1 c. à s.;ail:1 gousse;brocoli:150 g;*gingembre;*huile', "Lance le riz / Fais dorer le poulet en dés / Ajoute soja, miel, ail et gingembre, laisse caraméliser 2 min / Cuis le brocoli à la vapeur et sers le tout"],
  ['Bowl poulet, patate douce & avocat', '🥗', 30, 620, 45, 'prot post batch', "poulet:170 g;patate douce:1;avocat:1/2;épinards:1 poignée;*paprika;*huile d'olive;*sel", 'Coupe la patate douce en cubes, huile + paprika, four 25 min à 200 °C / Poêle le poulet assaisonné / Monte le bowl avec les épinards et l\'avocat'],
  ['Saumon au four, riz & haricots verts', '🐟', 25, 640, 40, 'prot post', "saumon:150 g;riz:70 g;haricots verts:150 g;citron:1/2;*huile d'olive;*aneth", 'Four 200 °C : saumon arrosé de citron et aneth, 12–15 min / Cuis riz et haricots verts / Un filet d\'huile d\'olive, c\'est prêt'],
  ['Pâtes bolo maison à la dinde', '🍝', 30, 700, 50, 'prot masse batch eco', 'pâtes:100 g;dinde hachée:150 g;coulis de tomate:200 ml;oignon:1;carotte:1;ail:1 gousse;*herbes de Provence', "Fais revenir oignon, carotte râpée et ail / Ajoute la dinde, fais dorer / Verse le coulis + herbes, mijote 15 min / Sers sur les pâtes"],
  ['Chili con carne léger', '🌶️', 35, 610, 45, 'prot batch masse eco', "boeuf haché 5%:150 g;haricots rouges:120 g;tomates concassées:200 g;poivron:1;oignon:1;riz:60 g;*cumin;*piment", 'Fais revenir oignon et poivron / Ajoute le bœuf, puis tomates, haricots et épices / Mijote 20 min / Sers avec le riz — encore meilleur le lendemain'],
  ['Steak, pommes de terre rôties & salade', '🥩', 30, 640, 45, 'prot masse', "steak:180 g;pommes de terre:250 g;salade:1 poignée;*huile d'olive;*romarin;*sel", 'Pommes de terre en quartiers, huile + romarin, four 25 min / Saisis le steak 2–3 min par face / Laisse reposer 3 min et sers avec la salade'],
  ['Wok de bœuf aux légumes', '🥡', 20, 560, 42, 'prot rapide', "boeuf:160 g;nouilles:70 g;poivron:1;courgette:1;sauce soja:2 c. à s.;ail:1 gousse;*gingembre;*huile", 'Fais cuire les nouilles / Saisis le bœuf en lanières à feu vif, réserve / Fais sauter les légumes, remets le bœuf, soja, ail, gingembre, puis les nouilles'],
  ['Curry de poulet coco', '🍛', 30, 680, 44, 'prot batch masse', 'poulet:170 g;lait de coco:100 ml;riz:70 g;oignon:1;épinards:1 poignée;*curry:1 c. à s.;*huile', "Fais revenir l'oignon et le curry / Ajoute le poulet en dés / Verse le lait de coco, mijote 15 min, ajoute les épinards / Sers avec le riz"],
  ['Burger maison healthy', '🍔', 20, 690, 45, 'prot masse', 'pain burger complet:1;boeuf haché 5%:150 g;tomate:1;salade:1 feuille;oignon rouge:1/4;fromage:1 tranche;*moutarde', 'Forme un steak et cuis-le 3–4 min par face / Fais fondre le fromage dessus / Monte le burger avec légumes et moutarde'],
  ['Poulet rôti citron-ail & légumes', '🍋', 45, 560, 50, 'prot batch seche', "poulet:200 g;courgette:1;poivron:1;oignon rouge:1;citron:1;ail:3 gousses;*huile d'olive;*thym", 'Coupe les légumes en gros morceaux / Ajoute le poulet, citron, ail écrasé, thym et huile / Four 200 °C 35–40 min'],
  ['Tacos de poulet épicé', '🌮', 20, 590, 42, 'prot rapide', 'tortilla:2;poulet:160 g;avocat:1/2;tomate:1;oignon rouge:1/4;citron vert:1/2;*paprika;*cumin', "Fais dorer le poulet émincé avec paprika et cumin / Prépare une salsa tomate-oignon-citron vert / Garnis les tortillas avec poulet, avocat et salsa"],
  ['Dinde à la moutarde & riz', '🦃', 20, 560, 48, 'prot rapide eco', 'dinde:170 g;riz:70 g;crème légère:50 ml;*moutarde:1 c. à s.;champignons:100 g', 'Cuis le riz / Poêle la dinde et les champignons / Ajoute crème et moutarde, laisse napper 2 min'],
  ['Crevettes ail & citron, riz basmati', '🍤', 15, 520, 38, 'prot rapide seche', "crevettes:180 g;riz:70 g;ail:2 gousses;citron:1/2;persil:1 poignée;*huile d'olive;*piment", "Cuis le riz / Saute les crevettes 3 min avec ail, piment et huile / Citron et persil à la fin"],
  ['Thon mi-cuit, salade de quinoa', '🍣', 20, 540, 45, 'prot seche', "thon:150 g;quinoa:60 g;concombre:1/2;tomate cerise:8;sésame:1 c. à c.;*sauce soja;*huile d'olive", 'Cuis le quinoa et laisse tiédir / Saisis le thon 1 min par face / Mélange quinoa et légumes, tranche le thon, sésame et soja'],
  ['Cabillaud en papillote', '🐠', 25, 380, 36, 'prot seche', "cabillaud:180 g;courgette:1;tomate:1;citron:1/2;*huile d'olive;*herbes", 'Dépose légumes en rondelles et poisson sur du papier cuisson / Citron, herbes, huile / Ferme et four 200 °C 18 min'],
  ['Omelette de pommes de terre (tortilla)', '🥔', 30, 520, 26, 'vege eco batch', "oeufs:4;pommes de terre:250 g;oignon:1;*huile d'olive;*sel", 'Fais cuire pommes de terre et oignon en fines tranches à la poêle 15 min / Mélange avec les œufs battus / Cuis à feu doux, retourne à l\'aide d\'une assiette'],
  // ---------- Portugal ----------
  ['Bacalhau à Brás', '🇵🇹', 30, 560, 38, 'portugais prot', "bacalhau:150 g;pommes de terre:150 g;oeufs:3;oignon:1;olives noires:6;persil:1 poignée;*huile d'olive", "Dessale la morue (24 h) ou achète-la déjà dessalée, effiloche-la / Fais revenir l'oignon puis la morue / Ajoute des pommes de terre en fines allumettes cuites, puis les œufs battus hors du feu / Olives et persil"],
  ['Frango piri-piri', '🔥', 40, 580, 52, 'portugais prot batch', "poulet:250 g;piment piri-piri:2;ail:3 gousses;citron:1;*paprika;*huile d'olive;*sel", "Mixe piment, ail, citron, paprika et huile / Fais mariner le poulet au moins 1 h / Four 200 °C 30 min ou grill, en badigeonnant"],
  ['Caldo verde', '🥬', 35, 380, 16, 'portugais eco seche', "couve:150 g;pommes de terre:200 g;oignon:1;ail:1 gousse;chouriço:40 g;*huile d'olive", "Cuis pommes de terre, oignon et ail dans l'eau 20 min et mixe / Ajoute le chou (couve) en très fines lanières, 5 min / Sers avec des rondelles de chouriço et un filet d'huile"],
  ['Sardines grillées & salade', '🐟', 15, 450, 34, 'portugais prot rapide seche', "sardines:4;poivron:1;tomate:1;oignon:1/2;pain complet:1 tranche;*huile d'olive;*gros sel", 'Grille les sardines au gros sel 3–4 min par face / Salade tomate-poivron-oignon / Sers sur une tranche de pain comme au São João'],
  ['Arroz de pato léger', '🦆', 50, 620, 40, 'portugais batch masse', 'canard:150 g;riz:80 g;chouriço:30 g;oignon:1;*laurier', "Cuis le canard avec oignon et laurier dans l'eau 30 min, effiloche / Cuis le riz dans le bouillon / Mélange riz et canard, rondelles de chouriço dessus, 10 min au four"],
  ['Bifana maison', '🥪', 20, 560, 38, 'portugais prot rapide', 'porc:150 g;pain:1;ail:2 gousses;vin blanc:50 ml;*paprika;*laurier;*moutarde', "Fais mariner le porc en fines tranches avec ail, vin, paprika, laurier / Poêle 2–3 min en ajoutant la marinade / Glisse dans le pain avec de la moutarde"],
  ['Polvo à lagareiro', '🐙', 60, 540, 40, 'portugais prot', "poulpe:250 g;pommes de terre:200 g;ail:4 gousses;*huile d'olive;*gros sel", "Cuis le poulpe 40 min dans l'eau / Pommes de terre « à murro » (au four, écrasées d'un coup de poing) / Arrose le tout d'huile d'olive chaude à l'ail"],
  // ---------- Végé ----------
  ['Dahl de lentilles corail', '🍲', 25, 520, 24, 'vege eco batch', 'lentilles corail:80 g;lait de coco:80 ml;tomates concassées:200 g;oignon:1;riz:50 g;*curry;*cumin', "Fais revenir l'oignon et les épices / Ajoute lentilles, tomates, coco et 200 ml d'eau / Mijote 15–20 min et sers avec le riz"],
  ['Buddha bowl pois chiches rôtis', '🥙', 30, 560, 22, 'vege batch', "pois chiches:150 g;quinoa:60 g;patate douce:1/2;épinards:1 poignée;houmous:2 c. à s.;*paprika;*huile d'olive", "Rôtis pois chiches et patate douce au paprika 25 min à 200 °C / Cuis le quinoa / Assemble avec épinards et houmous"],
  ['Tofu sauté, légumes & nouilles', '🥢', 20, 540, 30, 'vege prot rapide', 'tofu:150 g;nouilles:70 g;brocoli:100 g;carotte:1;sauce soja:2 c. à s.;*sésame;*huile', "Dore le tofu en cubes / Fais sauter les légumes / Ajoute nouilles cuites, soja et sésame"],
  ['Shakshuka', '🍅', 25, 420, 24, 'vege prot eco', "oeufs:3;tomates concassées:400 g;poivron:1;oignon:1;feta:30 g;pain complet:1 tranche;*cumin;*paprika", "Fais revenir oignon et poivron, ajoute tomates et épices, 10 min / Creuse 3 puits et casse les œufs / Couvre 6–8 min, feta dessus, sers avec le pain"],
  ['Chili sin carne', '🫘', 35, 520, 26, 'vege batch eco', 'haricots rouges:150 g;lentilles:50 g;tomates concassées:400 g;maïs:60 g;oignon:1;riz:60 g;*cumin;*piment', 'Fais revenir l\'oignon et les épices / Ajoute le reste (sauf riz) et 150 ml d\'eau, mijote 25 min / Sers avec le riz'],
  ['Pâtes pesto, tomates & mozzarella', '🌿', 15, 620, 26, 'vege rapide', 'pâtes:100 g;pesto:2 c. à s.;tomate cerise:10;mozzarella:60 g;roquette:1 poignée', 'Cuis les pâtes / Mélange avec le pesto / Ajoute tomates, mozzarella et roquette'],
  ['Omelette champignons & fromage', '🍄', 10, 400, 30, 'vege prot rapide eco seche', 'oeufs:3;champignons:100 g;fromage râpé:30 g;*sel;*poivre', "Poêle les champignons / Verse les œufs battus / Fromage, plie et sers"],
  // ---------- Léger / sèche ----------
  ['Salade niçoise protéinée', '🥗', 15, 450, 38, 'seche prot rapide', "thon:1 boîte;oeufs:2;haricots verts:100 g;tomate:1;olives noires:6;salade:1 poignée;*huile d'olive;*vinaigre", 'Cuis les œufs durs 9 min et les haricots verts / Assemble tout / Vinaigrette légère'],
  ['Poulet grillé & légumes rôtis', '🍢', 35, 420, 45, 'seche prot batch', "poulet:180 g;courgette:1;poivron:1;aubergine:1/2;*huile d'olive;*herbes de Provence", 'Légumes en cubes, huile et herbes, four 200 °C 25 min / Grille le poulet 5–6 min par face'],
  ['Soupe de légumes & lentilles', '🥕', 35, 320, 18, 'seche vege eco batch', 'lentilles:60 g;carotte:2;poireau:1;pommes de terre:1;oignon:1;*bouillon cube:1', 'Coupe tout en morceaux / Couvre d\'eau avec le bouillon et les lentilles, 25 min / Mixe ou laisse en morceaux'],
  ['Wrap de dinde & crudités', '🌯', 5, 420, 34, 'seche rapide prot', 'tortilla:1;jambon de dinde:4 tranches;fromage frais:2 c. à s.;salade:1 poignée;carotte:1;concombre:1/2', 'Tartine la tortilla de fromage frais / Ajoute dinde et crudités râpées / Roule serré et coupe en deux'],
  ['Colin, purée de brocoli', '🥦', 20, 380, 38, 'seche prot', 'colin:180 g;brocoli:250 g;pommes de terre:1;*huile d\'olive;*sel', 'Cuis brocoli et pomme de terre à l\'eau, mixe avec un filet d\'huile / Poêle le colin 3 min par face'],
  ['Courgettes farcies à la dinde', '🥒', 40, 420, 38, 'seche prot', 'courgette:2;dinde hachée:150 g;tomates concassées:100 g;oignon:1/2;fromage râpé:20 g;*herbes', 'Évide les courgettes / Fais revenir dinde, oignon, chair de courgette et tomate / Farcis, fromage dessus, four 25 min à 190 °C'],
  // ---------- Prise de masse ----------
  ['Riz sauté œufs, poulet & petits pois', '🍚', 20, 780, 50, 'masse prot rapide eco', 'riz:100 g;poulet:150 g;oeufs:2;petits pois:80 g;sauce soja:2 c. à s.;*huile', "Utilise du riz de la veille / Dore le poulet, pousse sur le côté, brouille les œufs / Ajoute riz, petits pois et soja, saute 3 min"],
  ['Pâtes crème-saumon-épinards', '🍝', 20, 820, 45, 'masse prot', 'pâtes:120 g;saumon:120 g;crème légère:80 ml;épinards:1 poignée;citron:1/2', 'Cuis les pâtes / Poêle le saumon en dés, ajoute crème et épinards / Mélange avec les pâtes, zeste de citron'],
  ['Bagel saumon & fromage frais', '🥯', 5, 560, 30, 'masse rapide prot', 'bagel:1;saumon fumé:60 g;fromage frais:2 c. à s.;concombre:1/2;*aneth', 'Toaste le bagel / Fromage frais, concombre, saumon et aneth'],
  ['Gainer maison', '🥛', 3, 850, 45, 'masse post sucre rapide', "lait:400 ml;flocons d'avoine:80 g;banane:1;beurre de cacahuète:2 c. à s.;whey:1 dose", 'Tout au blender, 45 s / À boire en collation entre deux repas'],
  ['Hachis parmentier de dinde', '🥧', 45, 720, 45, 'masse batch prot eco', 'dinde hachée:150 g;pommes de terre:300 g;lait:80 ml;oignon:1;fromage râpé:30 g;*muscade', 'Fais une purée avec pommes de terre et lait / Fais revenir dinde et oignon / Monte en couches, fromage, four 20 min à 200 °C'],
  // ---------- Snacks & sucré ----------
  ['Energy balls dattes-cacao', '🍫', 15, 90, 3, 'sucre vege batch', "dattes:100 g;flocons d'avoine:50 g;cacao:1 c. à s.;beurre de cacahuète:1 c. à s.", "Mixe tout / Forme 10 boules / 30 min au frigo — 1 ou 2 avant l'entraînement"],
  ['Mug cake protéiné', '🧁', 3, 330, 30, 'sucre prot rapide', "whey:1 dose;oeufs:1;flocons d'avoine:20 g;cacao:1 c. à c.;lait:30 ml", 'Mélange tout dans un mug / Micro-ondes 60–70 s'],
  ['Fromage blanc, miel & noix', '🍯', 2, 280, 22, 'sucre rapide prot vege', 'fromage blanc:200 g;miel:1 c. à c.;noix:15 g', 'Dans un bol, c\'est tout — parfait avant de dormir (protéines lentes)'],
  ['Banana bread healthy', '🍌', 50, 190, 7, 'sucre vege batch', "banane:3;oeufs:2;farine complète:150 g;miel:2 c. à s.;levure:1 sachet;noix:30 g", 'Écrase les bananes, mélange avec œufs, miel, farine et levure / Ajoute les noix / Moule, four 180 °C 40 min (10 parts)'],
  ['Pastel de nata allégé (pour le plaisir)', '🥮', 40, 210, 6, 'portugais sucre', 'pâte feuilletée:1;lait:250 ml;oeufs:3;sucre:60 g;maïzena:20 g;*cannelle;citron:1', "Chauffe lait, sucre, zeste de citron et maïzena en fouettant jusqu'à épaississement, hors du feu ajoute les jaunes / Garnis des moules foncés de pâte / Four très chaud (250 °C) 12–15 min — 12 pièces"],
  ['Toast beurre de cacahuète & banane', '🥜', 3, 380, 13, 'sucre rapide eco vege', 'pain complet:2 tranches;beurre de cacahuète:1 c. à s.;banane:1', 'Grille le pain, tartine, rondelles de banane dessus'],
  ['Houmous maison & crudités', '🥕', 10, 300, 12, 'vege eco rapide', "pois chiches:200 g;tahini:1 c. à s.;citron:1/2;ail:1 gousse;carotte:2;concombre:1/2;*huile d'olive;*cumin", 'Mixe pois chiches, tahini, citron, ail, huile et un peu d\'eau / Sers avec carottes et concombre en bâtonnets'],
  // ---------- Batch / rapides étudiant ----------
  ['Salade de pâtes poulet-pesto (lunchbox)', '🍱', 20, 640, 42, 'batch prot rapide', 'pâtes:90 g;poulet:130 g;pesto:1 c. à s.;tomate cerise:8;mozzarella:40 g;roquette:1 poignée', "Cuis les pâtes et le poulet / Mélange tout avec le pesto / Se garde 3 jours au frigo"],
  ['Riz, thon & haricots (ultra éco)', '🥫', 15, 560, 40, 'eco rapide prot', 'riz:80 g;thon:1 boîte;haricots rouges:100 g;maïs:50 g;*huile d\'olive;*citron', 'Cuis le riz / Mélange avec thon, haricots et maïs / Huile d\'olive et citron'],
  ['Œufs cocotte au four', '🥚', 15, 320, 22, 'rapide vege eco prot', 'oeufs:2;épinards:1 poignée;crème légère:2 c. à s.;fromage râpé:15 g;*sel', 'Dans un ramequin : épinards, crème, œufs, fromage / Four 180 °C 10–12 min'],
  ['Quesadillas poulet-fromage', '🧀', 15, 620, 45, 'prot rapide masse', 'tortilla:2;poulet:120 g;fromage râpé:40 g;poivron:1/2;maïs:40 g', "Garnis une tortilla de poulet émincé, poivron, maïs et fromage / Couvre de l'autre tortilla / Poêle 3 min par face"],
  ['Soupe miso express', '🍜', 10, 300, 22, 'rapide seche', 'miso:1 c. à s.;tofu:100 g;nouilles:40 g;épinards:1 poignée;oignon vert:1', "Dilue le miso dans de l'eau chaude (pas bouillante) / Ajoute tofu, nouilles cuites, épinards et oignon vert"],
  ['Poêlée de gnocchis, saucisse de volaille & légumes', '🥘', 20, 690, 32, 'masse rapide', 'gnocchis:200 g;saucisse de volaille:2;courgette:1;tomate cerise:10;*huile d\'olive;*herbes', 'Dore les gnocchis à la poêle / Ajoute saucisses en rondelles et courgette / Tomates cerises 2 min à la fin'],
];

// Nettoyage des noms d'ingrédients pour la recherche « frigo »
export const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').trim();

export const RECIPES = RAW.map((r, i) => {
  const [name, emoji, time, kcal, prot, tags, ings, steps] = r;
  return {
    id: 'r' + i, name, emoji, time, kcal, prot,
    tags: tags.split(' '),
    ingredients: ings.split(';').map(x => {
      const basic = x.startsWith('*');
      const [n, q = ''] = x.replace('*', '').split(':');
      return { name: n.trim(), qty: q.trim(), basic, key: norm(n) };
    }),
    steps: steps.split(' / '),
  };
});

export const TAGS = {
  prot: '💪 Protéiné', rapide: '⚡ Rapide', masse: '📈 Prise de masse', seche: '🔥 Léger / sèche', post: '🥊 Après l\'entraînement',
  petitdej: '🌅 Petit-déj', vege: '🌱 Végé', sucre: '🍫 Envie de sucré', portugais: '🇵🇹 Portugais', batch: '🍱 Batch cooking', eco: '💶 Petit budget',
};
