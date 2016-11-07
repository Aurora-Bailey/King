var x = {};
x.version = 'FH9M2'; // This version converts from single game to multi game
x.mv = 'v2033'; // Micro Version
x.maxnamelength = 15;

x.game = {}

x.game.game_classic = {};
x.game.game_classic.areaperplayer = 49;// will be rounded to the closest square root number
x.game.game_classic.loopdelay = 1000; // one tick per second
x.game.game_classic.maxmovequeue = 600; // max number of moves you can queue up
x.game.game_classic.queue = {};
x.game.game_classic.queue.minplayers = 2;
x.game.game_classic.queue.maxplayers = 16; // 4x4
x.game.game_classic.queue.maxwait = 1000*60*2; // 2 minutes in miliseconds


x.game.game_cities = {};
x.game.game_cities.areaperplayer = 49;// will be rounded to the closest square root number
x.game.game_cities.loopdelay = 1000; // one tick per second
x.game.game_cities.maxmovequeue = 600; // max number of moves you can queue up
x.game.game_cities.queue = {};
x.game.game_cities.queue.minplayers = 2;
x.game.game_cities.queue.maxplayers = 9; // 3x3
x.game.game_cities.queue.maxwait = 1000*60*2; // 2 minutes in miliseconds

x.game.game_exp_large_map = {};
x.game.game_exp_large_map.areaperplayer = 150;// will be rounded to the closest square root number
x.game.game_exp_large_map.loopdelay = 1000; // one tick per second
x.game.game_exp_large_map.maxmovequeue = 600; // max number of moves you can queue up
x.game.game_exp_large_map.queue = {};
x.game.game_exp_large_map.queue.minplayers = 2;
x.game.game_exp_large_map.queue.maxplayers = 25; // 5x5
x.game.game_exp_large_map.queue.maxwait = 1000*60*2; // 2 minutes in miliseconds

//x.mainGame = 'game_cities';
x.mainGame = 'game_exp_large_map';


x.server = {}; // change zero to god here and Nginx
x.server.roomNameList = ["god","gear","door","root","find","tune","shop","bowl","drug","keep","bird","male","sell","ride","gulf","fail","came","kick","hour","idea","name","laid","wave","inch","that","part","text","need","sort","band","many","room","sick","must","fund","nick","gone","same","harm","fell","know","than","diet","fine","weak","ever","tell","easy","crew","toll","unit","item","mean","warm","west","matt","roll","jump","ship","cold","bomb","film","desk","acid","crop","task","near","lady","hair","bath","rock","data","rent","farm","user","jane","send","exit","very","four","rain","slow","vast","cool","week","hire","live","okay","duty","peak","ford","game","sept","pipe","ruth","step","gold","true","tank","plan","club","term","were","thin","feed","burn","dial","list","half","each","meet","wind","over","fact","coat","girl","type","tape","five","keen","miss","view","wood","cook","when","bear","yeah","side","logo","grow","soon","menu","hill","rose","grew","news","neck","post","ward","paid","them","next","look","then","moon","plus","sake","days","mood","turn","flow","lake","till","dear","will","suit","into","used","hero","bill","push","deny","high","kept","wait","bank","upon","cope","make","fair","book","free","aged","wear","mere","link","main","mile","team","with","show","rest","kill","mine","goes","thus","pace","wild","held","fall","bell","soil","twin","town","rule","boat","food","dark","tall","navy"];
x.server.gameport = 8000;// dynamic 8000++
x.server.serverport = 7777;// static
x.server.godport = 7770;// static

module.exports = x;
