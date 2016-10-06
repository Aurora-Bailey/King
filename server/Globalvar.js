var x = {};
x.version = 'LKYHFOEIHLSKDJGEG'; // this version is live as of 10/4/2015 11:32 PM
x.maxnamelength = 15;

x.queue = {};
x.queue.minplayers = 2;
x.queue.maxplayers = 16; // 4x4
x.queue.maxwait = 15000; //1000*60*5; // 5 minutes in miliseconds

x.game = {};
x.game.areaperplayer = 49;// will be rounded to the closest square root number
x.game.loopdelay = 1000; // one tick per second
x.game.maxmovequeue = 10; // max number of moves you can queue up

x.server = {};
x.server.roomNameList = ["zero","gear","door","root","find","tune","shop","bowl","drug","keep","bird","male","sell","ride","gulf","fail","came","kick","hour","idea","name","laid","wave","inch","that","part","text","need","sort","band","many","room","sick","must","fund","nick","gone","same","harm","fell","know","than","diet","fine","weak","ever","tell","easy","crew","toll","unit","item","mean","warm","west","matt","roll","jump","ship","cold","bomb","film","desk","acid","crop","task","near","lady","hair","bath","rock","data","rent","farm","user","jane","send","exit","very","four","rain","slow","vast","cool","week","hire","live","okay","duty","peak","ford","game","sept","pipe","ruth","step","gold","true","tank","plan","club","term","were","thin","feed","burn","dial","list","half","each","meet","wind","over","fact","coat","girl","type","tape","five","keen","miss","view","wood","cook","when","bear","yeah","side","logo","grow","soon","menu","hill","rose","grew","news","neck","post","ward","paid","them","next","look","then","moon","plus","sake","days","mood","turn","flow","lake","till","dear","will","suit","into","used","hero","bill","push","deny","high","kept","wait","bank","upon","cope","make","fair","book","free","aged","wear","mere","link","main","mile","team","with","show","rest","kill","mine","goes","thus","pace","wild","held","fall","bell","soil","twin","town","rule","boat","food","dark","tall","navy"];
x.server.gameport = 8000;// dynamic 8000++
x.server.serverport = 7777;// static

module.exports = x;
