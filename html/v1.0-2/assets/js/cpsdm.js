
//スクリーンクラス群
/**
 * 継承用クラス(ホントは抽象クラスにしたかったけど、JavaScriptにはないので)
 */
class DefaultScreen {
    deckList;
    tutorial;
    cpsDM;
    constructor(cls) {
        if (cls === undefined || !(cls instanceof CpsDM))
            throw new Error(this.constructor.name + 'クラスはCpsDMクラスを通して操作すること！');
        if (this.constructor === DefaultScreen)
            throw new Error('DefaultScreenクラスはインスタンス化できません！');
        if (this.Render === undefined)
            throw new Error('Renderメソッドが実装されていません！');
        this.deckList = cls.deckList;
        this.tutorial = cls.tutorial;
        this.cpsDM = cls;
    }
    Render = () => { };
}
/**
 * 左のメニュー操作用クラス(CpsDMクラスを通して操作すること！)
 */
class LeftMenuScreen extends DefaultScreen {
    constructor(cls) {
        super(cls);
    }

    Render = () => {
        $("#deckList ul").removeClass("editMode");//編集モードを解除
        //デッキリストを描画
        $("#deckList ul").empty();
    }
}

class LoadingScreen extends DefaultScreen {
    progress = 0;
    statusText = "";
    isShown = true;
    isChangingState = false;
    constructor(cls) {
        super(cls);
    }
    /**
     * プログレスバーの進捗を設定する
     * @param {Number} progress 0~100で進捗を表す
     */
    SetProgress(progress) {
        if (progress instanceof Number) this.progress = progress;
        $("#loadingScreen  .progress-bar").css("width", progress + "%");
        $("#loadingScreen  .progress-bar").attr("aria-valuenow" ,progress + "%");
    }
    /**
     * ステータステキストを設定する
     * @param {String} statusText ステータステキスト
     */
    SetStatus(statusText) {
        if (statusText instanceof String) this.statusText = statusText;
        $("#loadingScreen .status").text(statusText);
    }

    HideLoadingScreen(duration = 1000) {
        if (!this.isChangingState) {
            this.isChangingState = true;
            $("#loadingScreen").fadeOut(duration, function () {
                $("#loadingScreen").hide();
                this.isChangingState = false;
                this.isShown = false;
            });
        }
    }

    ShowLoadingScreen(duration = 1000) {
        if (!this.isChangingState) {
            this.isChangingState = true;
            $("#loadingScreen").hide();
            $("#loadingScreen").fadeIn(duration, function () {
                this.isChangingState = false;
                this.isShown = true;
            });
        }
    }

    Render = () => {
        $("#loadingScreen").show();
        $("#loadingScreen").removeClass('hide');
        this.SetProgress(undefined);
        this.SetStatus(undefined);
    }
}

class MainScreen extends DefaultScreen {
    deckList;
    tutorial;
    cpsDm;
    constructor(cls) {
        super(cls);
    }

    ReloadData = () => {
        this.cpsDm.LoadServerConfig();
        this.cpsDm.LoadSaveData();
        this.cpsDm.leftMenuScreen.Render();
    }

    Render = () => {

    }
}

//ユーティリティクラス群(外部呼び出し用)
class AudioUtils {
    static playing = false;
    /**
     *
     * @param {String} audioSource 音源ファイルのパス
     * @param {Boolean} asyncPlay 同時再生を許可するかどうか
     * @param {*} volume
     */
    constructor(audioSource, asyncPlay = false, volume = 1) {
        this.audioSource = audioSource;
        this.asyncPlay = asyncPlay;
        this.volume = volume;
    }
    Play = () => {
        if (this.asyncPlay || (!this.asyncPlay && !AudioUtils.playing)) {
            let audio = new Audio(this.audioSource);
            audio.volume = this.volume;
            audio.play();
            AudioUtils.playing = true;
            setTimeout(() => {
                AudioUtils.playing = false;
            }, audio.duration * 1000);
        } else {
            console.warn("指定した音声の同時再生が許可されていません。");
        }
    }
}
class StrUtils {
    /**
     * ランダムな文字列を生成する(Copilotにより生成)
     * @param {Number} length 文字列の長さ
     * @returns ランダムな文字列
     */
    static GetRandomString = (length = 10) => {
        let result = '';
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
    /**
     * ランダムなUUIDを生成する(Copilotにより生成)
     * @returns {String} UUID
     */
    static GenerateUuid = () => {
        let d = new Date().getTime();
        if (window.performance && typeof window.performance.now === "function") {
            d += performance.now(); //use high-precision timer if available
        }
        let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }
}


//基本クラス(GameClass)群
class CpsDM {
    deckList;
    tutorial;
    MainScreen;
    LeftMenuScreen;
    LoadingScreen;
    constructor() {
        this.LoadSaveData();
        this.LoadServerConfig();
        this.mainScreen = new MainScreen(this);
        this.leftMenuScreen = new LeftMenuScreen(this);
        this.LoadingScreen = new LoadingScreen(this);
        this.LoadingScreen.Render();
    }

    Initialize = () => {
        this.LoadingScreen.SetProgress(0);
        this.LoadingScreen.SetStatus("#コンパスのデータを読み込んでいます...");
        this.LoadServerConfig();
        this.LoadingScreen.SetProgress(20);
        this.LoadingScreen.SetProgress(40);
        this.leftMenuScreen.Render();
        this.LoadingScreen.SetProgress(60);
        this.mainScreen.Render();
        this.LoadingScreen.SetProgress(80);
        this.LoadingScreen.HideLoadingScreen();
        this.LoadingScreen.SetProgress(100);
        this.LoadingScreen.SetStatus("読み込み完了");
    }

    /**
     * LocalStorageに保存されたデータを読み込む
     * @constructor
     */
    LoadSaveData = () => {
        if (localStorage.getItem('deckList') !== undefined)
            this.deckList = JSON.parse(localStorage.getItem('deckList'))
        else
            this.deckList = {
                version: 1,
                decks: [
                    {
                        id: Utils().generateUuid()
                    }
                ]
            }
        if (localStorage.getItem('tutorial') !== undefined)
            this.tutorial = JSON.parse(localStorage.getItem('tutorial'));
        else
            this.tutorial = {
                version: 1,
                step: 0,
                completed: []
            }
    }

    /**
     * サーバ上にある設定ファイルを読み込む
     * @constructor
     */
    LoadServerConfig = () => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://raw.githubusercontent.com/mf-Mii/CompassDeckManager/master/config.json', true);
        xhr.onload = () => {
            if (xhr.status === 200) {
                const config = JSON.parse(xhr.responseText);
                if (config.version > this.config.version) {
                    this.config = config;
                    this.Save();
                }
            }
        };
        xhr.send();
    }
}

class Deck {
    /**
     *
     * @param {String} id デッキのUUID
     * @param {String} name デッキ名
     * @param {Array<NormalCard>} cards デッキのカード(4)
     * @param {Number} heroId
     */
    constructor(id = new StrUtils.GenerateUuid(), name = "デッキ", cards = [], heroId = 0) {
        this.id = id;
        this.name = name;
        this.cards = cards;
        this.heroId = heroId;
    }
    /**
     * デッキのUUIDを取得する
     * @returns {String} デッキのUUID
     */
    GetID() {
        return this.id;
    }
    /**
     * デッキ名を取得する
     * @returns {String} デッキ名
     */
    GetName() {
        return this.name;
    }
    /**
     * デッキ名を設定する
     * @param {String} name デッキ名
     */
    SetName(name) {
        this.name = name;
    }
    /**
     * デッキのカードを取得する
     * @returns {Array<NormalCard>} デッキのカード配列
     */
    GetCards() {
        return this.cards;
    }
    /**
     * デッキのカードを設定する
     * @param {Array<NormalCard>} cards デッキのカード配列
     */
    SetCards(cards) {
        this.cards = cards;
    }
    /**
     * デッキのヒーローIDを取得する
     * @returns {Number} デッキのヒーローID
     */
    GetHeroId() {
        return this.heroId;
    }
    /**
     * ヒーローをIDで設定する
     * @param {Number} heroId ヒーローID
     */
    SetHeroId(heroId) {
        this.heroId = heroId;
    }
}

/**
 * 通常のカード
 */
class NormalCard {
    static Category = {
        BARRIER: "バリア",
        BUFF: "強化",
        DEBUFF: "弱体化",
        TELEPORT: "移動",
        REFLECTION: "反射",
        HEAL: "回復",
        NEAR: "近距離",
        FAR: "遠距離",
        RANGE: "周囲",
        FLURRY: "連続",
        OTHER: "その他",
    }
    static Target = {
        SELF: "自分",
        ALLY: "味方",
        ENEMY: "敵",
        ALL: "全体",
    }
    static Area = {
        SINGLE: "単体",
        ALL: "全体",
        DISTANCE: "周囲",
    }
    static Rarity = {
        N: "N",
        R: "R",
        SR: "SR",
        UR: "UR"
    }
    static Rank = {
        F: "F",
        E: "E",
        D: "D",
        C: "C",
        B: "B",
        A: "A",
        S: "S",
        COLLABO: "コラボ"
    }
    static InvokeTime = {
        NONE: "無",
        SHORT: "短",
        LONG: "長"
    }
    /**
     * カードインスタンスを生成
     * @param {String} id カードID
     * @param {String} name カード名
     * @param {String} category カードカテゴリ<Card.Categoryの値>
     * @param {String} target ターゲット<Card.Targetの値>
     * @param {String} rarity レアリティ<Card.Rarityの値>
     * @param {String} rank 入手可能ランク<Card.Rankの値>
     * @param {String} invokeTime 発動時間<Card.InvokeTimeの値>
     * @param {String} image カード画像のURL
     * @param {Number} statusAttack 攻撃ステータス
     * @param {Number} statusDefense 防御ステータス
     * @param {Number} statusLife 体力ステータス
     * @param {Number} description 説明文
     * @param {Number} cooldownTime クールダウンタイム
     * @param {Number} attackScale 攻撃倍率
     * @param {Array<String>} nicknames 別名
     * @param {Boolean} isSeasonCard シーズンカードかどうか
     * @param {String} collaboName コラボ名(通常はnull※undefinedは不可)
     */
    constructor(id, name, category, target, rarity, rank, invokeTime, image, statusAttack, statusDefense, statusLife, description, cooldownTime, attackScale, nicknames = [], isSeasonCard = false, collaboName = null
    ) {
        //パラメータが不足している場合はエラーを投げる
        if (id === undefined || name === undefined || category === undefined || target === undefined || rarity === undefined || rank === undefined || invokeTime === undefined || image === undefined || statusAttack === undefined || statusDefense === undefined || statusLife === undefined || description === undefined || cooldownTime === undefined, attackScale === undefined)
            throw new Error("パラメータが不足しています。");

        this.id = id;
        this.name = name;
        this.category = category;
        this.target = target;
        this.rarity = rarity;
        this.rank = rank;
        this.invokeTime = invokeTime;
        this.image = image;
        this.status = {
            attack: statusAttack,
            defense: statusDefense,
            life: statusLife
        }
        this.description = description;
        this.cooldownTime = cooldownTime;
        this.attackScale = attackScale;
        this.nicknames = nicknames;
        this.isSeasonCard = isSeasonCard;
        this.isCollaboCard = !!collaboName;
        this.collaboName = collaboName;
    }
    /**
     * カードIDを取得
     * @returns {String} カードID
     */
    GetID() {
        return this.id;
    }
    /**
     * カード名を取得
     * @returns {String} カード名
     */
    GetName() {
        return this.name;
    }
    /**
     * カテゴリを取得
     * @returns {String} カードカテゴリ
     */
    GetCategory() {
        return this.category;
    }
    /**
     * ターゲットを取得
     * @returns {String} ターゲット
     */
    GetTarget() {
        return this.target;
    }
    /**
     * カードレアリティを取得
     * @returns {String} レアリティ
     */
    GetRarity() {
        return this.rarity;
    }
    /**
     * 入手可能ランクを取得
     * @returns {String} 入手可能ランク
     */
    GetRank() {
        return this.rank;
    }
    /**
     * 発動時間を取得
     * @returns {String} 発動時間
     */
    GetInvokeTime() {
        return this.invokeTime;
    }
    /**
     * カード画像のURLを取得
     * @returns {String} カード画像のURL
     */
    GetImageURL() {
        return this.image;
    }
    /**
     * カードステータスを取得
     * @returns {Object} カードステータス
     * @example {
     *  attack: 100,
     *  defense: 100,
     *  life: 100
     * }
     */
    GetStatus() {
        return this.status;
    }
    /**
     * 説明文を取得
     * @returns {String} 説明文
     */
    GetDescription() {
        return this.description;
    }
    /**
     * クールダウンタイムを取得
     * @returns {Number} クールダウンタイム
     */
    GetCooldownTime() {
        return this.cooldownTime;
    }
    /**
     * 攻撃倍率を取得
     * @returns {Number} 攻撃倍率
     */
    GetAttackScale() {
        return this.attackScale;
    }
    /**
     * 通称名を取得
     * @returns {Array<String>} 通称名の配列
     */
    GetNicknames() {
        return this.nicknames;
    }

    GetPushValue() {
        return this.push;
    }

    IsSeasonCard() {
        return this.isSeasonCard;
    }

    IsCollaboCard() {
        return this.isCollaboCard;
    }

    GetCollaboName() {
        return this.collaboName;
    }
}

class BarrierCard extends NormalCard {
    /**
     * カードインスタンスを生成
     * @param {String} id カードID
     * @param {String} name カード名
     * @param {String} category カードカテゴリ<Card.Categoryの値>
     * @param {String} target ターゲット<Card.Targetの値>
     * @param {String} rarity レアリティ<Card.Rarityの値>
     * @param {String} rank 入手可能ランク<Card.Rankの値>
     * @param {String} invokeTime 発動時間<Card.InvokeTimeの値>
     * @param {String} image カード画像のURL
     * @param {Number} statusAttack 攻撃ステータス
     * @param {Number} statusDefense 防御ステータス
     * @param {Number} statusLife 体力ステータス
     * @param {Number} description 説明文
     * @param {Number} cooldownTime クールダウンタイム
     * @param {Number} attackScale 攻撃倍率
     * @param {Number} barrierPercent バリア防御率(0~100%)
     * @param {Number} barrierDuration バリア持続時間(秒)
     * @param {Boolean} isHealBarrier 回復可能かどうか
     * @param {Array<String>} nicknames 別名
     * @param {Boolean} isSeasonCard シーズンカードかどうか
     * @param {String} collaboName コラボ名(通常はnull※undefinedは不可)
     */
    constructor(id, name, category, target, rarity, rank, invokeTime,
                image, statusAttack, statusDefense, statusLife, description,
                cooldownTime, attackScale,
                barrierPercent, barrierDuration, isHealBarrier,
                nicknames = [], isSeasonCard = false, collaboName = null
    ) {
        super(id, name, category, target, rarity, rank, invokeTime, image, statusAttack, statusDefense, statusLife,
            description, cooldownTime, attackScale, nicknames, isSeasonCard, collaboName);
        this.barrierPercent = barrierPercent;
        this.barrierDuration = barrierDuration;
        this.isHealBarrier = isHealBarrier;
    }

    GetBarrierPercent() {
        return this.barrierPercent;
    }

    GetBarrierDuration() {
        return this.barrierDuration;
    }

    IsHealBarrier() {
        return this.isHealBarrier;
    }
}

/**
 * 強化カードクラス
 */
class BuffCard extends NormalCard {
    static BuffType = {
        ATTACK: "攻撃力",
        DEFENSE: "防御力",
        SPEED: "移動速度",
        SPECIAL: "特殊"
    }
    /**
     * カードインスタンスを生成
     * @param {String} id カードID
     * @param {String} name カード名
     * @param {String} category カードカテゴリ<Card.Categoryの値>
     * @param {String} target ターゲット<Card.Targetの値>
     * @param {String} rarity レアリティ<Card.Rarityの値>
     * @param {String} rank 入手可能ランク<Card.Rankの値>
     * @param {String} invokeTime 発動時間<Card.InvokeTimeの値>
     * @param {String} image カード画像のURL
     * @param {Number} statusAttack 攻撃ステータス
     * @param {Number} statusDefense 防御ステータス
     * @param {Number} statusLife 体力ステータス
     * @param {Number} description 説明文
     * @param {Number} cooldownTime クールダウンタイム
     * @param {Number} attackScale 攻撃倍率
     * @param {Array<BuffCard.BuffType>|BuffCard.BuffType} buffType 強化タイプ, 複数ある場合はArray
     * @param {Number} buffValue 強化のステータス上昇割合
     * @param {Number} buffDuration 強化の持続時間
     * @param {String|null} buffDemerit 強化のデメリット(通常はnull)
     * @param {Array<String>} nicknames 別名
     * @param {Boolean} isSeasonCard シーズンカードかどうか
     * @param {String} collaboName コラボ名(通常はnull※undefinedは不可)
     */
    constructor(id, name, category, target, rarity, rank, invokeTime,
                image, statusAttack, statusDefense, statusLife, description,
                cooldownTime, attackScale,
                buffType, buffValue, buffDuration, buffDemerit = null,
                nicknames = [], isSeasonCard = false, collaboName = null
    ) {
        super(id, name, category, target, rarity, rank, invokeTime, image, statusAttack, statusDefense, statusLife,
            description, cooldownTime, attackScale, nicknames, isSeasonCard, collaboName);
        this.buffType = buffType;
        this.buffValue = buffValue;
        this.buffDuration = buffDuration;
        this.buffDemerit = buffDemerit;
    }

    /**
     * 強化タイプを取得
     * @returns {Array<BuffCard.BuffType>|BuffCard.BuffType} 強化タイプ, 複数ある場合はArray
     */
    GetBuffType() {
        return this.buffType;
    }

    /**
     * 強化のステータス上昇割合を取得
     * @returns {Number} 強化のステータス上昇割合
     */
    GetBuffValue() {
        return this.buffValue;
    }

    /**
     * 強化の持続時間を取得
     * @returns {Number} 強化の持続時間
     */
    GetBuffDuration() {
        return this.buffDuration;
    }

    /**
     * 強化のデメリットを取得
     * @returns {String|null} 強化のデメリット(デメリットがない場合はnull)
     */
    GetBuffDemerit() {
        return this.buffDemerit;
    }
}


/**
 * 弱体化カードクラス
 */
class DebuffCard extends NormalCard {
    static DebuffType = {
        ATTACK: "攻撃力",
        DEFENSE: "防御力",
        SPEED: "移動速度",
        SPECIAL: "特殊"
    }
    /**
     * カードインスタンスを生成
     * @param {String} id カードID
     * @param {String} name カード名
     * @param {String} category カードカテゴリ<Card.Categoryの値>
     * @param {String} target ターゲット<Card.Targetの値>
     * @param {String} rarity レアリティ<Card.Rarityの値>
     * @param {String} rank 入手可能ランク<Card.Rankの値>
     * @param {String} invokeTime 発動時間<Card.InvokeTimeの値>
     * @param {String} image カード画像のURL
     * @param {Number} statusAttack 攻撃ステータス
     * @param {Number} statusDefense 防御ステータス
     * @param {Number} statusLife 体力ステータス
     * @param {Number} description 説明文
     * @param {Number} cooldownTime クールダウンタイム
     * @param {Number} attackScale 攻撃倍率
     * @param {Array<DebuffCard.DebuffType>|DebuffCard.DebuffType} debuffType 弱体化タイプ, 複数ある場合はArray
     * @param {Number} debuffValue 弱体化のステータス上昇割合
     * @param {Number} debuffDuration 弱体化の持続時間
     * @param {String|null} debuffDemerit 弱体化のデメリット(通常はnull)
     * @param {Array<String>} nicknames 別名
     * @param {Boolean} isSeasonCard シーズンカードかどうか
     * @param {String} collaboName コラボ名(通常はnull※undefinedは不可)
     */
    constructor(id, name, category, target, rarity, rank, invokeTime,
                image, statusAttack, statusDefense, statusLife, description,
                cooldownTime, attackScale,
                debuffType, debuffValue, debuffDuration, debuffDemerit = null,
                nicknames = [], isSeasonCard = false, collaboName = null
    ) {
        super(id, name, category, target, rarity, rank, invokeTime, image, statusAttack, statusDefense, statusLife,
            description, cooldownTime, attackScale, nicknames, isSeasonCard, collaboName);
        this.debuffType = debuffType;
        this.debuffValue = debuffValue;
        this.debuffDuration = debuffDuration;
        this.debuffDemerit = debuffDemerit;
    }

    /**
     * 弱体化タイプを取得
     * @returns {Array<DebuffCard.DebuffType>|DebuffCard.DebuffType} 弱体化タイプ, 複数ある場合はArray
     */
    GetDebuffType() {
        return this.debuffType;
    }

    /**
     * 弱体化のステータス上昇割合を取得
     * @returns {Number} 弱体化のステータス上昇割合
     */
    GetDebuffValue() {
        return this.debuffValue;
    }

    /**
     * 弱体化の持続時間を取得
     * @returns {Number} 弱体化の持続時間
     */
    GetDebuffDuration() {
        return this.debuffDuration;
    }

    /**
     * 弱体化のデメリットを取得
     * @returns {String|null} 弱体化のデメリット(デメリットがない場合はnull)
     */
    GetDebuffDemerit() {
        return this.debuffDemerit;
    }
}


/**
 * 移動カードクラス
 */
class TeleportCard extends NormalCard {
    static TeleportTo = {
        HOME: "自陣リスポーン地点",
        ENEMY: "敵の背後",
        PORTAL: "ポータル"
    }
    static TeleportEffect = {
        NONE: null,
        STAN: "スタン",
        SPEED: "移動速度上昇",
        HEAL: "回復"
    }
    /**
     * カードインスタンスを生成
     * @param {String} id カードID
     * @param {String} name カード名
     * @param {String} category カードカテゴリ<Card.Categoryの値>
     * @param {String} target ターゲット<Card.Targetの値>
     * @param {String} rarity レアリティ<Card.Rarityの値>
     * @param {String} rank 入手可能ランク<Card.Rankの値>
     * @param {String} invokeTime 発動時間<Card.InvokeTimeの値>
     * @param {String} image カード画像のURL
     * @param {Number} statusAttack 攻撃ステータス
     * @param {Number} statusDefense 防御ステータス
     * @param {Number} statusLife 体力ステータス
     * @param {Number} description 説明文
     * @param {Number} cooldownTime クールダウンタイム
     * @param {Number} attackScale 攻撃倍率
     * @param teleportTo
     * @param teleportEffect
     * @param teleportEffectDuration
     * @param {Array<String>} nicknames 別名
     * @param {Boolean} isSeasonCard シーズンカードかどうか
     * @param {String} collaboName コラボ名(通常はnull※undefinedは不可)
     */
    constructor(id, name, category, target, rarity, rank, invokeTime,
                image, statusAttack, statusDefense, statusLife, description,
                cooldownTime, attackScale,
                teleportTo, teleportEffect, teleportEffectDuration,
                nicknames = [], isSeasonCard = false, collaboName = false
    ) {
        super(id, name, category, target, rarity, rank, invokeTime, image, statusAttack, statusDefense, statusLife,
            description, cooldownTime, attackScale, nicknames, isSeasonCard, collaboName);
        this.isHealContinuous = !!healDuration;
        this.healAmount = {
            self: healAmountSelf,
            ally: healAmountAlly
        }
        this.isPortal = isPortal;
    }

    IsHealContinuous() {
        return this.isHealContinuous;
    }

    IsPortal() {
        return this.isPortal;
    }

    GetHealAmounts() {
        return this.healAmount;
    }

    GetHealAmountSelf() {
        return this.healAmount.self;
    }

    GetHealAmountAlly() {
        return this.healAmount.ally;
    }
}


class HealCard extends NormalCard {
    /**
     * カードインスタンスを生成
     * @param {String} id カードID
     * @param {String} name カード名
     * @param {String} category カードカテゴリ<Card.Categoryの値>
     * @param {String} target ターゲット<Card.Targetの値>
     * @param {String} rarity レアリティ<Card.Rarityの値>
     * @param {String} rank 入手可能ランク<Card.Rankの値>
     * @param {String} invokeTime 発動時間<Card.InvokeTimeの値>
     * @param {String} image カード画像のURL
     * @param {Number} statusAttack 攻撃ステータス
     * @param {Number} statusDefense 防御ステータス
     * @param {Number} statusLife 体力ステータス
     * @param {Number} description 説明文
     * @param {Number} cooldownTime クールダウンタイム
     * @param {Number} attackScale 攻撃倍率
     * @param {Number} healAmountSelf 自分自身の回復量
     * @param {Number|null} healAmountAlly 味方の回復量(回復しない場合はnull)
     * @param {Number|null} healDuration 回復の持続時間(持続でない場合はnull)
     * @param {Boolean} isPortal ポータル設置かどうか
     * @param {Array<String>} nicknames 別名
     * @param {Boolean} isSeasonCard シーズンカードかどうか
     * @param {String} collaboName コラボ名(通常はnull※undefinedは不可)
     */
    constructor(id, name, category, target, rarity, rank, invokeTime,
                image, statusAttack, statusDefense, statusLife, description,
                cooldownTime, attackScale,
                healAmountSelf, healAmountAlly, healDuration, isPortal = false,
                nicknames = [], isSeasonCard = false, collaboName = false
    ) {
        super(id, name, category, target, rarity, rank, invokeTime, image, statusAttack, statusDefense, statusLife,
            description, cooldownTime, attackScale, nicknames, isSeasonCard, collaboName);
        this.isHealContinuous = !!healDuration;
        this.healAmount = {
            self: healAmountSelf,
            ally: healAmountAlly
        }
        this.isPortal = isPortal;
    }

    IsHealContinuous() {
        return this.isHealContinuous;
    }

    IsPortal() {
        return this.isPortal;
    }

    GetHealAmounts() {
        return this.healAmount;
    }

    GetHealAmountSelf() {
        return this.healAmount.self;
    }

    GetHealAmountAlly() {
        return this.healAmount.ally;
    }
}


/**
 * 攻撃カード
 */
class AttackCard extends NormalCard {
    static EffectType = {
        NONE: "なし",
        STAN: "スタン",
        POISON: "毒",
        SILENT: "沈黙",
        PUSH: "押し出し",
        PULL: "引き寄せ",
        PUSH_UP: "上昇",
        STEAL: "体力奪取",
        HS_STEAL: "HS奪取",
        BREAK: "防御破壊",
        DIRECT: "貫通"
    }
    static AttackType = {
        NEAR: "近距離",
        FAR: "遠距離",
        RANGE: "周囲",
        SMASH: "連続"
    }
    push = {
        horizontal: null,
        vertical: null
    };
    attackType;
    effectType;
    /**
     * カードインスタンスを生成
     * @param {String} id カードID
     * @param {String} name カード名
     * @param {String} category カードカテゴリ<Card.Categoryの値>
     * @param {String} target ターゲット<Card.Targetの値>
     * @param {String} rarity レアリティ<Card.Rarityの値>
     * @param {String} rank 入手可能ランク<Card.Rankの値>
     * @param {String} invokeTime 発動時間<Card.InvokeTimeの値>
     * @param {String} image カード画像のURL
     * @param {Number} statusAttack 攻撃ステータス
     * @param {Number} statusDefense 防御ステータス
     * @param {Number} statusLife 体力ステータス
     * @param {Number} description 説明文
     * @param {Number} cooldownTime クールダウンタイム
     * @param {Number} attackScale 攻撃倍率
     * @param {String} attackType 攻撃の種類
     * @param {Array<String>} effectType 効果の一覧
     * @param {Array<String>} nicknames 別名
     * @param {Number} pushV 押し出しの垂直方向の値
     * @param {Number} pushH 押し出しの水平方向の値
     * @param {Boolean} isSeasonCard シーズンカードかどうか
     * @param {String} collaboName コラボ名(通常はnull※undefinedは不可)
     */
    constructor(id, name, category, target, rarity, rank, invokeTime,
                image, statusAttack, statusDefense, statusLife, description,
                cooldownTime, attackScale,
                attackType, effectType,
                nicknames = [], pushV, pushH, isSeasonCard = false,
                collaboName = null
    ){
        if (!!attackType || !!effectType) throw new Error("パラメータが不足しています");
        super(id, name, category, target, rarity, rank, invokeTime, image, statusAttack, statusDefense, statusLife, description, cooldownTime, attackScale, nicknames, isSeasonCard, collaboName);
        if (!!pushV && !!pushH)
            this.push = {
                horizontal: pushH,
                vertical: pushV
            }
        this.attackType = attackType;
        this.effectType = effectType;
    }

    GetPushValue() {
        return this.push;
    }

    GetAttackType() {
        return this.attackType;
    }

    GetEffectType() {
        return this.effectType;
    }
}
