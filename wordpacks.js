const WORD_PACKS = [
  {
    id: "elevenplus",
    name: "11 plus vocabulary",
    tagline: "Close synonyms, trickier to bluff",
    icon: "school",
    color: "coral",
    type: "pairs",
    pairs: [
      ["Reluctant","Hesitant"],["Abundant","Plentiful"],["Furious","Irritated"],
      ["Enormous","Substantial"],["Peculiar","Unusual"],["Diligent","Conscientious"],
      ["Gloomy","Melancholy"],["Courageous","Audacious"],["Feeble","Fragile"],
      ["Meticulous","Thorough"],["Ancient","Archaic"],["Generous","Charitable"],
      ["Vast","Immense"],["Cunning","Devious"],["Weary","Exhausted"],
      ["Timid","Bashful"],["Vivid","Striking"],["Stubborn","Obstinate"],
      ["Fortunate","Prosperous"],["Anxious","Apprehensive"],
      ["Obscure","Vague"],["Radiant","Luminous"],["Frivolous","Trivial"],
      ["Tedious","Monotonous"],["Candid","Frank"],["Eloquent","Articulate"],
      ["Ominous","Foreboding"],["Tranquil","Serene"],["Zealous","Fervent"],
      ["Wary","Cautious"],["Resilient","Tenacious"],["Benevolent","Compassionate"],
      ["Turbulent","Chaotic"],["Skeptical","Doubtful"],["Pristine","Immaculate"],
      ["Elusive","Evasive"],["Prudent","Sensible"],["Volatile","Erratic"],
      ["Austere","Stark"],["Genial","Amiable"]
    ]
  },
  {
    id: "numbers",
    name: "Numbers 0 to 50",
    tagline: "Sharp listening required",
    icon: "hash",
    color: "amber",
    type: "numbers",
    min: 0,
    max: 50,
    minOffset: 1,
    maxOffset: 5
  },
  {
    id: "everyday",
    name: "Everyday items",
    tagline: "Ordinary things, not food",
    icon: "abc",
    color: "teal",
    type: "pairs",
    pairs: [
      ["Umbrella","Raincoat"],["Sofa","Armchair"],["Guitar","Violin"],["Train","Bus"],
      ["Library","Bookshop"],["Snow","Rain"],["Football","Rugby"],["Cat","Dog"],
      ["Mountain","Hill"],["Camera","Phone"],["Kitchen","Bathroom"],["Bicycle","Scooter"],
      ["Forest","Jungle"],["River","Lake"],["Winter","Autumn"],["Doctor","Nurse"],
      ["Shoe","Boot"],["Hat","Cap"],["Chair","Stool"],["Window","Door"],
      ["Pencil","Pen"],["Book","Magazine"],["Clock","Watch"],["Fork","Spoon"],
      ["Plate","Bowl"],["Garden","Park"],["School","College"],["Shop","Market"],
      ["Car","Van"],["Plane","Helicopter"],["Ship","Boat"],["Moon","Star"],
      ["Fire","Candle"],["Ice","Frost"],["Desert","Dune"],["Island","Peninsula"],
      ["Beach","Pool"],["Bucket","Basket"],["Backpack","Suitcase"],["Hammer","Screwdriver"]
    ]
  },
  {
    id: "animals",
    name: "Animals",
    tagline: "Spot the odd creature out",
    icon: "paw",
    color: "pink",
    type: "pairs",
    pairs: [
      ["Lion","Tiger"],["Dolphin","Shark"],["Eagle","Hawk"],["Rabbit","Hare"],
      ["Frog","Toad"],["Crocodile","Alligator"],["Wolf","Fox"],["Butterfly","Moth"],
      ["Donkey","Mule"],["Sparrow","Robin"],["Camel","Llama"],["Turtle","Tortoise"],
      ["Bee","Wasp"],["Owl","Falcon"],["Squirrel","Chipmunk"],
      ["Horse","Zebra"],["Elephant","Rhino"],["Giraffe","Antelope"],["Penguin","Puffin"],
      ["Kangaroo","Wallaby"],["Hedgehog","Porcupine"],["Snake","Lizard"],["Goat","Sheep"],
      ["Duck","Goose"],["Swan","Heron"],["Mouse","Rat"],["Bat","Swallow"],
      ["Whale","Shark"],["Octopus","Squid"],["Crab","Lobster"],["Ant","Termite"],
      ["Peacock","Pheasant"],["Flamingo","Stork"],["Bear","Panda"],["Leopard","Cheetah"],
      ["Otter","Beaver"],["Seal","Walrus"],["Parrot","Macaw"],["Cricket","Grasshopper"],
      ["Snail","Slug"]
    ]
  },
  {
    id: "food",
    name: "Food and drink",
    tagline: "For hungry imposters",
    icon: "food",
    color: "green",
    type: "pairs",
    pairs: [
      ["Apple","Pear"],["Orange","Lemon"],["Cheese","Butter"],["Soup","Stew"],
      ["Cake","Biscuit"],["Milk","Yoghurt"],["Chicken","Turkey"],["Rice","Couscous"],
      ["Chocolate","Caramel"],["Jam","Honey"],["Pancake","Waffle"],["Grape","Cherry"],
      ["Carrot","Parsnip"],["Salmon","Trout"],["Noodles","Spaghetti"],
      ["Burger","Sandwich"],["Fries","Chips"],["Sausage","Bacon"],["Pie","Tart"],
      ["Muffin","Cupcake"],["Strawberry","Raspberry"],["Banana","Plantain"],
      ["Potato","Sweet potato"],["Onion","Garlic"],["Pepper","Chilli"],
      ["Mushroom","Truffle"],["Ham","Salami"],["Prawn","Shrimp"],["Tuna","Mackerel"],
      ["Yam","Cassava"],["Broccoli","Cauliflower"],["Spinach","Kale"],
      ["Peach","Nectarine"],["Melon","Watermelon"],["Croissant","Brioche"],
      ["Doughnut","Pretzel"],["Lentils","Chickpeas"],["Cinnamon","Nutmeg"],["Vinegar","Oil"]
    ]
  },
  {
    id: "countries",
    name: "Countries",
    tagline: "A little geography test",
    icon: "globe",
    color: "blue",
    type: "pairs",
    pairs: [
      ["France","Spain"],["Japan","China"],["Kenya","Nigeria"],["Brazil","Argentina"],
      ["Norway","Sweden"],["Egypt","Morocco"],["Canada","Mexico"],["Italy","Greece"],
      ["India","Pakistan"],["Peru","Chile"],["Iceland","Ireland"],["Vietnam","Thailand"],
      ["Portugal","Spain"],["Poland","Germany"],["Australia","New Zealand"],
      ["Turkey","Iran"],["Russia","Ukraine"],["Finland","Denmark"],["Netherlands","Belgium"],
      ["Switzerland","Austria"],["Scotland","Wales"],["England","Wales"],
      ["South Africa","Zimbabwe"],["Ghana","Senegal"],["Ethiopia","Sudan"],
      ["Indonesia","Malaysia"],["Philippines","Vietnam"],["South Korea","Taiwan"],
      ["Colombia","Venezuela"],["Ecuador","Bolivia"],["Cuba","Jamaica"],
      ["Croatia","Slovenia"],["Hungary","Romania"],["Czech Republic","Slovakia"],
      ["Estonia","Latvia"],["Nepal","Bhutan"],["Qatar","UAE"],["Saudi Arabia","Oman"],
      ["Uruguay","Paraguay"],["Panama","Costa Rica"]
    ]
  },
  {
    id: "movies",
    name: "Movies",
    tagline: "Family film trivia",
    icon: "movie",
    color: "purple",
    type: "pairs",
    pairs: [
      ["Frozen","Moana"],["Toy Story","Cars"],["Shrek","Madagascar"],["Finding Nemo","Finding Dory"],
      ["The Lion King","Tarzan"],["Aladdin","Mulan"],["Up","Coco"],["Zootopia","Encanto"],
      ["Inside Out","Soul"],["Ratatouille","Brave"],["Wall-E","Big Hero 6"],["The Incredibles","Despicable Me"],
      ["Jurassic Park","King Kong"],["Star Wars","Star Trek"],["Harry Potter","Percy Jackson"],["The Matrix","Inception"],
      ["Batman","Superman"],["Spider-Man","Iron Man"],["Home Alone","The Grinch"],["Elf","Polar Express"],
      ["Jaws","Titanic"],["Avatar","Interstellar"],["Rocky","Creed"],["Cinderella","Snow White"],
      ["Beauty and the Beast","The Little Mermaid"],["Sing","Trolls"],["Minions","Ice Age"],["Kung Fu Panda","Puss in Boots"],
      ["How to Train Your Dragon","The Croods"],["Back to the Future","Groundhog Day"]
    ]
  }
];
