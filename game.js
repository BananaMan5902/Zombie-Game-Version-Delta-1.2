```javascript
// ============================================================
// ZOMBIE SURVIVAL
// Realistic-style top-down zombie survival
// ============================================================

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let W = window.innerWidth;
let H = window.innerHeight;

canvas.width = W;
canvas.height = H;


// ============================================================
// WORLD
// ============================================================

const WORLD_WIDTH = 7000;
const WORLD_HEIGHT = 7000;

const ROAD_WIDTH = 150;

const MARKET = {
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,
    width: 420,
    height: 300
};


// ============================================================
// GAME STATE
// ============================================================

let running = false;

let lastTime = 0;

let wave = 1;

let kills = 0;

let damageBonus = 0;

let zombies = [];

let bullets = [];

let flames = [];

let particles = [];

let trees = [];

let houses = [];

let roads = [];

let nextWaveTimer = 2;

let spawnTimer = 0;

let remainingToSpawn = 0;

let mouse = {
    x: W / 2,
    y: H / 2,
    down: false
};

let keys = {};

let camera = {
    x: MARKET.x,
    y: MARKET.y
};


// ============================================================
// PLAYER
// ============================================================

const player = {

    x: WORLD_WIDTH / 2,

    y: WORLD_HEIGHT / 2 + 700,

    radius: 17,

    speed: 245,

    sprint: 350,

    health: 100,

    maxHealth: 100,

    weapon: 1,

    pistolCooldown: 0,

    shotgunCooldown: 0,

    flameCooldown: 0,

    machineCooldown: 0,

    rifleCooldown: 0,

    invulnerable: 0

};


// ============================================================
// WEAPONS
// ============================================================

const weapons = {

    pistol: {
        name: "PISTOL",
        damage: 28,
        fireRate: .24,
        range: 900
    },

    shotgun: {
        name: "SHOTGUN",
        damage: 18,
        fireRate: .85,
        range: 520
    },

    flamethrower: {
        name: "FLAMETHROWER",
        damage: 6,
        fireRate: .09,
        range: 370
    },

    machinegun: {
        name: "MACHINE GUN",
        damage: 11,
        fireRate: .075,
        range: 1050
    },

    rifle: {
        name: "RIFLE",
        damage: 90,
        fireRate: .9,
        range: 1500
    }

};


// ============================================================
// ZOMBIE TYPES
// ============================================================

const zombieTypes = {

    weakSlow: {
        name: "Walker",
        health: 45,
        speed: 50,
        damage: 7,
        radius: 15
    },

    tankSlow: {
        name: "Tank",
        health: 180,
        speed: 30,
        damage: 15,
        radius: 22
    },

    fastWeak: {
        name: "Runner",
        health: 35,
        speed: 105,
        damage: 8,
        radius: 13
    },

    tankFast: {
        name: "Brute",
        health: 280,
        speed: 62,
        damage: 20,
        radius: 25
    }

};


// ============================================================
// INPUT
// ============================================================

window.addEventListener("keydown", e => {

    keys[e.key.toLowerCase()] = true;

    if (e.key === "1") player.weapon = 1;

    if (e.key === "2") player.weapon = 2;

    if (e.key === "3") player.weapon = 3;

    if (e.key === "4") player.weapon = 4;

    if (e.key === "5") player.weapon = 5;

    // E opens market when close
    if (e.key.toLowerCase() === "e") {

        if (isNearMarket()) {

            toggleMarket();

        }

    }

});

window.addEventListener("keyup", e => {

    keys[e.key.toLowerCase()] = false;

});

canvas.addEventListener("mousemove", e => {

    mouse.x = e.clientX;

    mouse.y = e.clientY;

});

canvas.addEventListener("mousedown", () => {

    mouse.down = true;

});

window.addEventListener("mouseup", () => {

    mouse.down = false;

});


// ============================================================
// RESIZE
// ============================================================

window.addEventListener("resize", () => {

    W = window.innerWidth;

    H = window.innerHeight;

    canvas.width = W;

    canvas.height = H;

});


// ============================================================
// HELPERS
// ============================================================

function rand(min, max) {

    return Math.random() * (max - min) + min;

}

function clamp(n, min, max) {

    return Math.max(min, Math.min(max, n));

}

function distance(a, b) {

    return Math.hypot(
        a.x - b.x,
        a.y - b.y
    );

}

function worldToScreen(x, y) {

    return {

        x: x - camera.x + W / 2,

        y: y - camera.y + H / 2

    };

}

function screenToWorld(x, y) {

    return {

        x: x + camera.x - W / 2,

        y: y + camera.y - H / 2

    };

}

function damageMultiplier() {

    return 1 + damageBonus / 100;

}


// ============================================================
// MAP
// ============================================================

function generateMap() {

    trees = [];

    houses = [];

    roads = [];


    // Main roads

    roads.push({
        x: WORLD_WIDTH / 2 - ROAD_WIDTH / 2,
        y: 0,
        width: ROAD_WIDTH,
        height: WORLD_HEIGHT
    });

    roads.push({
        x: 0,
        y: WORLD_HEIGHT / 2 - ROAD_WIDTH / 2,
        width: WORLD_WIDTH,
        height: ROAD_WIDTH
    });


    // Secondary roads

    roads.push({
        x: 1300,
        y: 0,
        width: 95,
        height: WORLD_HEIGHT
    });

    roads.push({
        x: 5600,
        y: 0,
        width: 95,
        height: WORLD_HEIGHT
    });

    roads.push({
        x: 0,
        y: 1300,
        width: WORLD_WIDTH,
        height: 95
    });

    roads.push({
        x: 0,
        y: 5600,
        width: WORLD_WIDTH,
        height: 95
    });


    // Houses

    for (let i = 0; i < 85; i++) {

        let x;
        let y;

        let attempts = 0;

        do {

            x = rand(250, WORLD_WIDTH - 250);

            y = rand(250, WORLD_HEIGHT - 250);

            attempts++;

        } while (
            isOnRoad(x, y) ||
            isInsideMarket(x, y) ||
            distance(
                {x, y},
                player
            ) < 400 ||
            attempts < 20 &&
            false
        );

        houses.push({

            x,

            y,

            width: rand(80, 150),

            height: rand(65, 120),

            rotation: Math.random() < .5 ? 0 : 0

        });

    }


    // Sparse trees

    for (let i = 0; i < 260; i++) {

        let x;
        let y;

        let attempts = 0;

        do {

            x = rand(100, WORLD_WIDTH - 100);

            y = rand(100, WORLD_HEIGHT - 100);

            attempts++;

        } while (
            isOnRoad(x, y) ||
            isInsideMarket(x, y) ||
            attempts < 20 &&
            false
        );

        trees.push({

            x,

            y,

            radius: rand(14, 25)

        });

    }

}


function isOnRoad(x, y) {

    for (const r of roads) {

        if (
            x > r.x &&
            x < r.x + r.width &&
            y > r.y &&
            y < r.y + r.height
        ) {
            return true;
        }

    }

    return false;

}


function isInsideMarket(x, y) {

    return (
        x >
        MARKET.x - MARKET.width / 2 &&

        x <
        MARKET.x + MARKET.width / 2 &&

        y >
        MARKET.y - MARKET.height / 2 &&

        y <
        MARKET.y + MARKET.height / 2
    );

}


// ============================================================
// ZOMBIE CLASS
// ============================================================

class Zombie {

    constructor(type, x, y) {

        const t = zombieTypes[type];

        this.type = type;

        this.name = t.name;

        this.x = x;

        this.y = y;

        this.health =
            t.health *
            (1 + wave * .018);

        this.maxHealth = this.health;

        this.speed =
            t.speed *
            (1 + wave * .004);

        this.damage = t.damage;

        this.radius = t.radius;

        this.dead = false;

        this.burning = false;

        this.burnTimer = 0;

        this.burnDamage = 0;

        this.attackCooldown = 0;

    }


    update(dt) {

        if (this.dead) return;


        // Burning damage

        if (this.burning) {

            this.burnTimer -= dt;

            this.health -=
                this.burnDamage * dt;

            if (this.burnTimer <= 0) {

                this.burning = false;

            }

            if (this.health <= 0) {

                killZombie(this);

                return;
            }

            // Fire spreads between zombies

            for (const other of zombies) {

                if (
                    other !== this &&
                    !other.dead &&
                    !other.burning &&
                    distance(this, other) < 75
                ) {

                    if (Math.random() < dt * 1.5) {

                        igniteZombie(other);

                    }

                }

            }

        }


        // Move toward player

        const dx = player.x - this.x;

        const dy = player.y - this.y;

        const d = Math.hypot(dx, dy);

        if (d > 1) {

            this.x +=
                dx / d *
                this.speed *
                dt;

            this.y +=
                dy / d *
                this.speed *
                dt;

        }


        // Zombie attacks

        this.attackCooldown -= dt;

        if (
            d <
            this.radius + player.radius + 8
        ) {

            if (this.attackCooldown <= 0) {

                hurtPlayer(this.damage);

                this.attackCooldown = .8;

            }

        }


        // Keep in world

        this.x =
            clamp(
                this.x,
                20,
                WORLD_WIDTH - 20
            );

        this.y =
            clamp(
                this.y,
                20,
                WORLD_HEIGHT - 20
            );

    }

}


// ============================================================
// SPAWNING
// ============================================================

function chooseZombieType() {

    const roll = Math.random();

    if (wave >= 50 && roll < .08) {

        return "tankFast";

    }

    if (roll < .23) {

        return "tankSlow";

    }

    if (roll < .48) {

        return "fastWeak";

    }

    return "weakSlow";

}


function spawnZombie() {

    let angle =
        rand(0, Math.PI * 2);

    let distanceFromPlayer =
        rand(750, 1100);

    let x =
        player.x +
        Math.cos(angle) *
        distanceFromPlayer;

    let y =
        player.y +
        Math.sin(angle) *
        distanceFromPlayer;

    x =
        clamp(x, 100, WORLD_WIDTH - 100);

    y =
        clamp(y, 100, WORLD_HEIGHT - 100);


    const type =
        wave === 100 &&
        remainingToSpawn === 1
            ? "tankFast"
            : chooseZombieType();


    const zombie =
        new Zombie(type, x, y);

    if (wave === 100) {

        zombie.health *= 1.7;

        zombie.maxHealth =
            zombie.health;

        zombie.radius *= 1.25;

        zombie.speed *= .9;

    }

    zombies.push(zombie);

}


// ============================================================
// WAVES
// ============================================================

function startWave() {

    remainingToSpawn =
        Math.floor(
            8 +
            wave * 3.5
        );

    if (wave === 100) {

        remainingToSpawn = 1;

        showMessage(
            "WAVE 100<br>BOSS ZOMBIE",
            4
        );

    } else {

        showMessage(
            "WAVE " + wave,
            2
        );

    }

}


function updateWave(dt) {

    if (remainingToSpawn > 0) {

        spawnTimer -= dt;

        if (spawnTimer <= 0) {

            spawnZombie();

            remainingToSpawn--;

            spawnTimer =
                Math.max(
                    .08,
                    .35 - wave * .0015
                );

        }

    } else if (zombies.length === 0) {

        nextWaveTimer -= dt;

        if (nextWaveTimer <= 0) {

            if (wave < 100) {

                wave++;

                startWave();

            } else {

                winGame();

            }

        }

    }

}


// ============================================================
// PLAYER
// ============================================================

function updatePlayer(dt) {

    let dx = 0;

    let dy = 0;

    if (keys["w"]) dy--;

    if (keys["s"]) dy++;

    if (keys["a"]) dx--;

    if (keys["d"]) dx++;


    if (dx !== 0 || dy !== 0) {

        const length =
            Math.hypot(dx, dy);

        dx /= length;

        dy /= length;

        const speed =
            keys["shift"]
                ? player.sprint
                : player.speed;

        player.x +=
            dx * speed * dt;

        player.y +=
            dy * speed * dt;

    }


    player.x =
        clamp(
            player.x,
            25,
            WORLD_WIDTH - 25
        );

    player.y =
        clamp(
            player.y,
            25,
            WORLD_HEIGHT - 25
        );


    if (player.invulnerable > 0) {

        player.invulnerable -= dt;

    }


    updateShooting(dt);

}


// ============================================================
// SHOOTING
// ============================================================

function getAimAngle() {

    const target =
        screenToWorld(
            mouse.x,
            mouse.y
        );

    return Math.atan2(
        target.y - player.y,
        target.x - player.x
    );

}


function updateShooting(dt) {

    player.pistolCooldown -= dt;

    player.shotgunCooldown -= dt;

    player.flameCooldown -= dt;

    player.machineCooldown -= dt;

    player.rifleCooldown -= dt;


    if (!mouse.down) return;


    if (player.weapon === 1) {

        if (player.pistolCooldown <= 0) {

            shootPistol();

            player.pistolCooldown =
                weapons.pistol.fireRate;

        }

    }


    if (player.weapon === 2) {

        if (player.shotgunCooldown <= 0) {

            shootShotgun();

            player.shotgunCooldown =
                weapons.shotgun.fireRate;

        }

    }


    if (player.weapon === 3) {

        if (player.flameCooldown <= 0) {

            shootFlamethrower();

            player.flameCooldown =
                weapons.flamethrower.fireRate;

        }

    }


    if (player.weapon === 4) {

        if (player.machineCooldown <= 0) {

            shootMachineGun();

            player.machineCooldown =
                weapons.machinegun.fireRate;

        }

    }


    if (player.weapon === 5) {

        if (player.rifleCooldown <= 0) {

            shootRifle();

            player.rifleCooldown =
                weapons.rifle.fireRate;

        }

    }

}


// ============================================================
// PISTOL
// ============================================================

function shootPistol() {

    const angle =
        getAimAngle() +
        rand(-.025, .025);

    createBullet(
        angle,
        weapons.pistol.damage *
        damageMultiplier(),
        weapons.pistol.range,
        7
    );

}


// ============================================================
// SHOTGUN
// ============================================================

function shootShotgun() {

    const base =
        getAimAngle();

    for (let i = 0; i < 9; i++) {

        const angle =
            base +
            rand(-.24, .24);

        createBullet(
            angle,
            weapons.shotgun.damage *
            damageMultiplier(),
            weapons.shotgun.range,
            6
        );

    }

    createMuzzleFlash();

}


// ============================================================
// MACHINE GUN
// ============================================================

function shootMachineGun() {

    const angle =
        getAimAngle() +
        rand(-.13, .13);

    createBullet(
        angle,
        weapons.machinegun.damage *
        damageMultiplier(),
        weapons.machinegun.range,
        5
    );

    createMuzzleFlash();

}


// ============================================================
// RIFLE
// ============================================================

function shootRifle() {

    const angle =
        getAimAngle() +
        rand(-.008, .008);

    createBullet(
        angle,
        weapons.rifle.damage *
        damageMultiplier(),
        weapons.rifle.range,
        10
    );

    createMuzzleFlash();

}


// ============================================================
// BULLETS
// ============================================================

function createBullet(
    angle,
    damage,
    range,
    size
) {

    bullets.push({

        x: player.x,

        y: player.y,

        vx: Math.cos(angle) * 1500,

        vy: Math.sin(angle) * 1500,

        damage,

        distance: 0,

        maxDistance: range,

        size

    });

}


function updateBullets(dt) {

    for (
        let i = bullets.length - 1;
        i >= 0;
        i--
    ) {

        const b = bullets[i];

        const move =
            1500 * dt;

        b.x += b.vx * dt;

        b.y += b.vy * dt;

        b.distance += move;


        let hit = false;


        for (const zombie of zombies) {

            if (zombie.dead) continue;

            if (
                Math.hypot(
                    b.x - zombie.x,
                    b.y - zombie.y
                ) <
                zombie.radius + b.size
            ) {

                zombie.health -= b.damage;

                hit = true;

                createBloodParticles(
                    zombie.x,
                    zombie.y,
                    5
                );

                if (zombie.health <= 0) {

                    killZombie(zombie);

                }

                break;

            }

        }


        if (
            hit ||
            b.distance > b.maxDistance ||
            b.x < 0 ||
            b.y < 0 ||
            b.x > WORLD_WIDTH ||
            b.y > WORLD_HEIGHT
        ) {

            bullets.splice(i, 1);

        }

    }

}


// ============================================================
// FLAMETHROWER
// ============================================================

function shootFlamethrower() {

    const angle =
        getAimAngle();

    // Several flame particles create
    // a wide medium-range stream.

    for (let i = 0; i < 5; i++) {

        const spread =
            rand(-.22, .22);

        const flameAngle =
            angle + spread;

        flames.push({

            x: player.x,

            y: player.y,

            vx:
                Math.cos(flameAngle) *
                rand(250, 390),

            vy:
                Math.sin(flameAngle) *
                rand(250, 390),

            life: rand(.35, .7),

            size: rand(8, 16)

        });

    }


    // Direct fire damage

    for (const zombie of zombies) {

        if (zombie.dead) continue;

        const dx =
            zombie.x - player.x;

        const dy =
            zombie.y - player.y;

        const d =
            Math.hypot(dx, dy);

        if (d > weapons.flamethrower.range)
            continue;

        const targetAngle =
            Math.atan2(dy, dx);

        let difference =
            Math.atan2(
                Math.sin(
                    targetAngle - angle
                ),
                Math.cos(
                    targetAngle - angle
                )
            );

        if (Math.abs(difference) < .34) {

            zombie.health -=
                weapons.flamethrower.damage *
                damageMultiplier();

            igniteZombie(zombie);

            if (zombie.health <= 0) {

                killZombie(zombie);

            }

        }

    }

}


function igniteZombie(zombie) {

    if (zombie.dead) return;

    zombie.burning = true;

    zombie.burnTimer =
        Math.max(
            zombie.burnTimer,
            3.5
        );

    zombie.burnDamage =
        11 *
        damageMultiplier();

}


// ============================================================
// FLAMES
// ============================================================

function updateFlames(dt) {

    for (
        let i = flames.length - 1;
        i >= 0;
        i--
    ) {

        const f = flames[i];

        f.x += f.vx * dt;

        f.y += f.vy * dt;

        f.life -= dt;


        for (const zombie of zombies) {

            if (zombie.dead) continue;

            if (
                Math.hypot(
                    f.x - zombie.x,
                    f.y - zombie.y
                ) <
                zombie.radius + f.size
            ) {

                igniteZombie(zombie);

            }

        }


        if (f.life <= 0) {

            flames.splice(i, 1);

        }

    }

}


// ============================================================
// KILLS
// ============================================================

function killZombie(zombie) {

    if (zombie.dead) return;

    zombie.dead = true;

    kills++;

    createBloodParticles(
        zombie.x,
        zombie.y,
        15
    );


    // Every 100 kills automatically
    // makes the next market upgrade available.

    updateHUD();

}


// ============================================================
// PLAYER DAMAGE
// ============================================================

function hurtPlayer(amount) {

    if (player.invulnerable > 0)
        return;

    player.health -= amount;

    player.invulnerable = .25;

    if (player.health <= 0) {

        player.health = 0;

        endGame();

    }

}


// ============================================================
// PARTICLES
// ============================================================

function createBloodParticles(
    x,
    y,
    count
) {

    for (let i = 0; i < count; i++) {

        particles.push({

            x,

            y,

            vx: rand(-80, 80),

            vy: rand(-80, 80),

            life: rand(.2, .7),

            size: rand(2, 5),

            type: "dust"

        });

    }

}


function createMuzzleFlash() {

    const angle =
        getAimAngle();

    for (let i = 0; i < 5; i++) {

        particles.push({

            x:
                player.x +
                Math.cos(angle) * 25,

            y:
                player.y +
                Math.sin(angle) * 25,

            vx:
                Math.cos(angle) *
                rand(100, 250),

            vy:
                Math.sin(angle) *
                rand(100, 250),

            life: .08,

            size: rand(3, 7),

            type: "flash"

        });

    }

}


function updateParticles(dt) {

    for (
        let i = particles.length - 1;
        i >= 0;
        i--
    ) {

        const p = particles[i];

        p.x += p.vx * dt;

        p.y += p.vy * dt;

        p.life -= dt;

        if (p.life <= 0) {

            particles.splice(i, 1);

        }

    }

}


// ============================================================
// MARKET
// ============================================================

function isNearMarket() {

    return (
        Math.abs(
            player.x - MARKET.x
        ) <
        MARKET.width / 2 + 100 &&

        Math.abs(
            player.y - MARKET.y
        ) <
        MARKET.height / 2 + 100
    );

}


function toggleMarket() {

    const menu =
        document.getElementById(
            "marketMenu"
        );

    if (
        menu.style.display === "flex"
    ) {

        menu.style.display = "none";

    } else {

        if (isNearMarket()) {

            menu.style.display = "flex";

            document.getElementById(
                "marketKills"
            ).textContent = kills;

        }

    }

}


document.getElementById(
    "closeMarket"
).addEventListener(
    "click",
    () => {

        document.getElementById(
            "marketMenu"
        ).style.display = "none";

    }
);


document.getElementById(
    "upgradeButton"
).addEventListener(
    "click",
    () => {

        if (kills >= 100) {

            kills -= 100;

            damageBonus += 5;

            updateHUD();

            document.getElementById(
                "marketKills"
            ).textContent = kills;

            document.getElementById(
                "marketText"
            ).textContent =
                `Damage bonus: +${damageBonus}%`;

        }

    }
);


// ============================================================
// CAMERA
// ============================================================

function updateCamera(dt) {

    camera.x +=
        (player.x - camera.x) *
        Math.min(1, dt * 6);

    camera.y +=
        (player.y - camera.y) *
        Math.min(1, dt * 6);

}


// ============================================================
// DRAW BACKGROUND
// ============================================================

function drawBackground() {

    ctx.fillStyle = "#4b5149";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );


    // Ground texture

    const gridSize = 100;

    const startX =
        Math.floor(
            (camera.x - W / 2) /
            gridSize
        ) * gridSize;

    const startY =
        Math.floor(
            (camera.y - H / 2) /
            gridSize
        ) * gridSize;


    ctx.strokeStyle =
        "rgba(0,0,0,.07)";

    ctx.lineWidth = 1;


    for (
        let x = startX;
        x < camera.x + W / 2;
        x += gridSize
    ) {

        const sx =
            x - camera.x + W / 2;

        ctx.beginPath();

        ctx.moveTo(sx, 0);

        ctx.lineTo(sx, H);

        ctx.stroke();

    }


    for (
        let y = startY;
        y < camera.y + H / 2;
        y += gridSize
    ) {

        const sy =
            y - camera.y + H / 2;

        ctx.beginPath();

        ctx.moveTo(0, sy);

        ctx.lineTo(W, sy);

        ctx.stroke();

    }

}


// ============================================================
// DRAW ROADS
// ============================================================

function drawRoads() {

    for (const road of roads) {

        const p =
            worldToScreen(
                road.x,
                road.y
            );

        ctx.fillStyle = "#343638";

        ctx.fillRect(
            p.x,
            p.y,
            road.width,
            road.height
        );


        // Road edge

        ctx.strokeStyle =
            "#242526";

        ctx.lineWidth = 5;

        ctx.strokeRect(
            p.x,
            p.y,
            road.width,
            road.height
        );


        // Center markings

        ctx.strokeStyle =
            "rgba(220,210,150,.65)";

        ctx.lineWidth = 3;

        ctx.setLineDash([25, 25]);


        if (
            road.width >
            road.height
        ) {

            ctx.beginPath();

            ctx.moveTo(
                p.x,
                p.y + road.height / 2
            );

            ctx.lineTo(
                p.x + road.width,
                p.y + road.height / 2
            );

            ctx.stroke();

        } else {

            ctx.beginPath();

            ctx.moveTo(
                p.x + road.width / 2,
                p.y
            );

            ctx.lineTo(
                p.x + road.width / 2,
                p.y + road.height
            );

            ctx.stroke();

        }

        ctx.setLineDash([]);

    }

}


// ============================================================
// DRAW HOUSES
// ============================================================

function drawHouses() {

    for (const house of houses) {

        const p =
            worldToScreen(
                house.x,
                house.y
            );

        if (
            p.x < -200 ||
            p.x > W + 200 ||
            p.y < -200 ||
            p.y > H + 200
        ) continue;


        // Shadow

        ctx.fillStyle =
            "rgba(0,0,0,.25)";

        ctx.fillRect(
            p.x - house.width / 2 + 8,
            p.y - house.height / 2 + 9,
            house.width,
            house.height
        );


        // Building

        ctx.fillStyle = "#80796b";

        ctx.fillRect(
            p.x - house.width / 2,
            p.y - house.height / 2,
            house.width,
            house.height
        );


        // Roof

        ctx.fillStyle = "#49443d";

        ctx.beginPath();

        ctx.moveTo(
            p.x - house.width / 2 - 5,
            p.y - house.height / 2
        );

        ctx.lineTo(
            p.x,
            p.y - house.height / 2 - 25
        );

        ctx.lineTo(
            p.x + house.width / 2 + 5,
            p.y - house.height / 2
        );

        ctx.closePath();

        ctx.fill();


        // Windows

        ctx.fillStyle = "#343b3b";

        ctx.fillRect(
            p.x - house.width * .25,
            p.y - 10,
            18,
            18
        );

        ctx.fillRect(
            p.x + house.width * .08,
            p.y - 10,
            18,
            18
        );


        // Door

        ctx.fillStyle = "#40372e";

        ctx.fillRect(
            p.x - 10,
            p.y + house.height / 2 - 38,
            20,
            38
        );

    }

}


// ============================================================
// DRAW TREES
// ============================================================

function drawTrees() {

    for (const tree of trees) {

        const p =
            worldToScreen(
                tree.x,
                tree.y
            );

        if (
            p.x < -60 ||
            p.x > W + 60 ||
            p.y < -60 ||
            p.y > H + 60
        ) continue;


        // Shadow

        ctx.beginPath();

        ctx.ellipse(
            p.x + 5,
            p.y + 10,
            tree.radius,
            tree.radius * .45,
            0,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "rgba(0,0,0,.25)";

        ctx.fill();


        // Trunk

        ctx.fillStyle = "#514034";

        ctx.fillRect(
            p.x - 4,
            p.y - 4,
            8,
            tree.radius + 15
        );


        // Foliage

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y - 10,
            tree.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#344b35";

        ctx.fill();


        ctx.beginPath();

        ctx.arc(
            p.x - tree.radius * .35,
            p.y - 7,
            tree.radius * .65,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#405b3e";

        ctx.fill();

    }

}


// ============================================================
// DRAW MARKET
// ============================================================

function drawMarket() {

    const p =
        worldToScreen(
            MARKET.x,
            MARKET.y
        );


    // Parking lot

    ctx.fillStyle = "#373838";

    ctx.fillRect(
        p.x - 300,
        p.y - 240,
        600,
        480
    );


    // Building

    ctx.fillStyle = "#756d5c";

    ctx.fillRect(
        p.x - MARKET.width / 2,
        p.y - MARKET.height / 2,
        MARKET.width,
        MARKET.height
    );


    // Roof

    ctx.fillStyle = "#3f403e";

    ctx.fillRect(
        p.x - MARKET.width / 2 - 10,
        p.y - MARKET.height / 2 - 18,
        MARKET.width + 20,
        28
    );


    // Front glass

    ctx.fillStyle = "#2d4548";

    ctx.fillRect(
        p.x - 150,
        p.y - 55,
        300,
        75
    );


    // Door

    ctx.fillStyle = "#222";

    ctx.fillRect(
        p.x - 25,
        p.y + 20,
        50,
        70
    );


    // Sign

    ctx.fillStyle = "#d8c45a";

    ctx.fillRect(
        p.x - 105,
        p.y - 115,
        210,
        45
    );


    ctx.fillStyle = "#222";

    ctx.font =
        "bold 28px Arial";

    ctx.textAlign = "center";

    ctx.fillText(
        "MARKET",
        p.x,
        p.y - 84
    );


    // Interaction ring

    if (isNearMarket()) {

        ctx.strokeStyle =
            "rgba(216,196,90,.8)";

        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y + 150,
            90,
            0,
            Math.PI * 2
        );

        ctx.stroke();


        ctx.fillStyle = "white";

        ctx.font =
            "bold 14px Arial";

        ctx.fillText(
            "PRESS E TO SHOP",
            p.x,
            p.y + 195
        );

    }

}


// ============================================================
// DRAW BULLETS
// ============================================================

function drawBullets() {

    for (const b of bullets) {

        const p =
            worldToScreen(
                b.x,
                b.y
            );

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            b.size,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#eee";

        ctx.fill();

    }

}


// ============================================================
// DRAW FLAMES
// ============================================================

function drawFlames() {

    for (const f of flames) {

        const p =
            worldToScreen(
                f.x,
                f.y
            );

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            f.size,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            Math.random() < .5
                ? "#ff8a00"
                : "#ffd84d";

        ctx.fill();

    }

}


// ============================================================
// DRAW ZOMBIES
// ============================================================

function drawZombies() {

    for (const zombie of zombies) {

        if (zombie.dead) continue;

        const p =
            worldToScreen(
                zombie.x,
                zombie.y
            );


        // Shadow

        ctx.beginPath();

        ctx.ellipse(
            p.x + 3,
            p.y + zombie.radius,
            zombie.radius,
            zombie.radius * .4,
            0,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "rgba(0,0,0,.3)";

        ctx.fill();


        // Body

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            zombie.radius,
            0,
            Math.PI * 2
        );

        let bodyColor =
            "#59604f";

        if (zombie.type === "tankSlow")
            bodyColor = "#4b5247";

        if (zombie.type === "fastWeak")
            bodyColor = "#69705b";

        if (zombie.type === "tankFast")
            bodyColor = "#3f473d";

        ctx.fillStyle = bodyColor;

        ctx.fill();


        // Burning effect

        if (zombie.burning) {

            ctx.beginPath();

            ctx.arc(
                p.x,
                p.y - zombie.radius,
                9 + Math.random() * 5,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                Math.random() < .5
                    ? "#ff7a00"
                    : "#ffd43b";

            ctx.fill();

        }


        // Eyes

        ctx.fillStyle = "#d5d5b0";

        ctx.beginPath();

        ctx.arc(
            p.x - 5,
            p.y - 3,
            2.5,
            0,
            Math.PI * 2
        );

        ctx.arc(
            p.x + 5,
            p.y - 3,
            2.5,
            0,
            Math.PI * 2
        );

        ctx.fill();


        // Health bar

        const barWidth =
            zombie.radius * 2.2;

        const healthPercent =
            zombie.health /
            zombie.maxHealth;

        ctx.fillStyle = "#222";

        ctx.fillRect(
            p.x - barWidth / 2,
            p.y - zombie.radius - 12,
            barWidth,
            4
        );

        ctx.fillStyle = "#b34a42";

        ctx.fillRect(
            p.x - barWidth / 2,
            p.y - zombie.radius - 12,
            barWidth *
                clamp(
                    healthPercent,
                    0,
                    1
                ),
            4
        );

    }

}


// ============================================================
// DRAW PLAYER
// ============================================================

function drawPlayer() {

    const p =
        worldToScreen(
            player.x,
            player.y
        );


    // Shadow

    ctx.beginPath();

    ctx.ellipse(
        p.x,
        p.y + 15,
        20,
        8,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(0,0,0,.35)";

    ctx.fill();


    // Body

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        player.radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#425866";

    ctx.fill();


    // Direction / weapon

    const angle =
        getAimAngle();

    ctx.strokeStyle = "#24282a";

    ctx.lineWidth = 8;

    ctx.beginPath();

    ctx.moveTo(
        p.x,
        p.y
    );

    ctx.lineTo(
        p.x +
        Math.cos(angle) * 29,
        p.y +
        Math.sin(angle) * 29
    );

    ctx.stroke();


    // Helmet

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y - 4,
        11,
        Math.PI,
        Math.PI * 2
    );

    ctx.fillStyle = "#68756c";

    ctx.fill();

}


// ============================================================
// DRAW PARTICLES
// ============================================================

function drawParticles() {

    for (const p of particles) {

        const s =
            worldToScreen(
                p.x,
                p.y
            );

        ctx.globalAlpha =
            clamp(
                p.life * 2,
                0,
                1
            );

        ctx.beginPath();

        ctx.arc(
            s.x,
            s.y,
            p.size,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            p.type === "flash"
                ? "#ffd45a"
                : "#76604f";

        ctx.fill();

    }

    ctx.globalAlpha = 1;

}


// ============================================================
// DRAW EVERYTHING
// ============================================================

function draw() {

    drawBackground();

    drawRoads();

    drawHouses();

    drawMarket();

    drawTrees();

    drawBullets();

    drawFlames();

    drawZombies();

    drawParticles();

    drawPlayer();

}


// ============================================================
// HUD
// ============================================================

function updateHUD() {

    waveText.textContent = wave;

    killsText.textContent = kills;

    healthText.textContent =
        Math.ceil(player.health);

    damageBonusText =
        document.getElementById(
            "bonus"
        );

    damageBonusText.textContent =
        `+${damageBonus}%`;


    let weapon;

    if (player.weapon === 1)
        weapon = weapons.pistol;

    if (player.weapon === 2)
        weapon = weapons.shotgun;

    if (player.weapon === 3)
        weapon = weapons.flamethrower;

    if (player.weapon === 4)
        weapon = weapons.machinegun;

    if (player.weapon === 5)
        weapon = weapons.rifle;


    weaponNameText.textContent =
        weapon.name;


    if (player.weapon === 1) {

        ammoText.textContent =
            `${player.pistolAmmo || 12} / ∞`;

    } else {

        ammoText.textContent =
            "∞";

    }

}


// ============================================================
// WAVE MESSAGE
// ============================================================

let messageTimer = 0;

function showMessage(text, seconds) {

    waveMessage.innerHTML = text;

    waveMessage.style.opacity = "1";

    messageTimer = seconds;

}


function updateMessage(dt) {

    if (messageTimer > 0) {

        messageTimer -= dt;

        if (messageTimer <= 0) {

            waveMessage.style.opacity = "0";

        }

    }

}


// ============================================================
// CLEAN ZOMBIES
// ============================================================

function cleanZombies() {

    zombies =
        zombies.filter(
            zombie =>
                !zombie.dead
        );

}


// ============================================================
// GAME OVER
// ============================================================

function endGame() {

    if (!running) return;

    running = false;

    gameOverScreen.style.display =
        "flex";

    gameOverTitle.textContent =
        "GAME OVER";

    gameOverText.textContent =
        `You survived to Wave ${wave} and got ${kills} kills.`;

}


function winGame() {

    running = false;

    gameOverScreen.style.display =
        "flex";

    gameOverTitle.textContent =
        "YOU SURVIVED 100 WAVES!";

    gameOverText.textContent =
        `Final kills: ${kills} · Damage bonus: +${damageBonus}%`;

}


// ============================================================
// START
// ============================================================

function resetGame() {

    wave = 1;

    kills = 0;

    damageBonus = 0;

    zombies = [];

    bullets = [];

    flames = [];

    particles = [];

    player.x =
        WORLD_WIDTH / 2;

    player.y =
        WORLD_HEIGHT / 2 + 700;

    player.health = 100;

    player.weapon = 1;

    player.invulnerable = 0;

    camera.x = player.x;

    camera.y = player.y;

    nextWaveTimer = 2;

    spawnTimer = 0;

    remainingToSpawn = 0;

    generateMap();

    updateHUD();

}


function startGame() {

    resetGame();

    running = true;

    startScreen.style.display =
        "none";

    gameOverScreen.style.display =
        "none";

    startWave();

    lastTime =
        performance.now();

    requestAnimationFrame(loop);

}


document.getElementById(
    "startButton"
).addEventListener(
    "click",
    startGame
);


document.getElementById(
    "restartButton"
).addEventListener(
    "click",
    startGame
);


// ============================================================
// MAIN LOOP
// ============================================================

function loop(timestamp) {

    if (!running) return;

    let dt =
        (timestamp - lastTime) / 1000;

    dt =
        Math.min(
            dt,
            .035
        );

    lastTime = timestamp;


    updatePlayer(dt);

    updateWave(dt);

    for (const zombie of zombies) {

        zombie.update(dt);

    }

    updateBullets(dt);

    updateFlames(dt);

    updateParticles(dt);

    updateCamera(dt);

    updateMessage(dt);

    cleanZombies();

    updateHUD();

    draw();


    requestAnimationFrame(loop);

}


// Initial map preview

generateMap();

updateHUD();
```
