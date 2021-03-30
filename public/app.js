document.addEventListener('DOMContentLoaded', () =>{
    const userGrid = document.querySelector('.grid-user');
    const computerGrid = document.querySelector('.grid-computer');
    const displayGrid = document.querySelector('.grid-display');
    const ships = document.querySelectorAll('.ship');
    const destroyer = document.querySelector('.destroyer-container');
    const submarine = document.querySelector('.submarine-container');
    const cruiser = document.querySelector('.cruiser-container');
    const battleship = document.querySelector('.battleship-container');
    const carrier = document.querySelector('.carrier-container');
    const startButton = document.querySelector('#start');
    const rotateButton = document.querySelector('#rotate');
    const turnDisplay = document.querySelector('#whose-go');
    const infoDisplay = document.querySelector('#info');
    const singlePlayerButton = document.querySelector('#singlePlayerButton');
    const multiplayerButton = document.querySelector('#multiplayerButton'); 
    const userSquares = [];
    const computerSquares = [];
    let isHorizontal = true;
    const width = 10;
    let isGameOver = false;
    let currentPlayer = 'user';
    let gameMode = "";
    let playerNum = 0;
    let ready = false;
    let enemyReady = false;
    let allShipsPlaced = false;
    let shotFired = -1;

    // Select Player Mode 
    singlePlayerButton.addEventListener('click', startSinglePlayer);
    multiplayerButton.addEventListener('click', startMuliplayer);

    //Multiplayer
    function startMuliplayer(){
        gameMode = "multiplayer";
        const socket = io();
        //get your player number
        socket.on('player-number', num => {
            if(num === -1){
                infoDisplay.innerHTML = "Sorry the game is full";
            }
            else{
                playerNum = parseInt(num);
                if(playerNum === 1){
                    currentPlayer = 'enemy';
                }
                console.log(playerNum);
                //Get other player status
                socket.emit('check-players');
            }
        });
        
        //Another player has connected or disconnected
        socket.on('player-connection', num => {
            console.log(`Player number ${num} has connected or disconnected`);
            playerConnectedOrDisconnected(num);
        });

        //On enemy Ready 
        socket.on('enemy-ready', num => {
            enemyReady = true;
            playerReady(num);
            if(ready){
                playGameMulti(socket);
            }
        });

        //Check player status
        socket.on('check-players', players => {
            players.forEach((p, i) => {
                if(p.connected){
                    playerConnectedOrDisconnected(i);
                }
                if(p.ready){
                    playerReady(i);
                    if(i !== playerNum){
                        enemyReady = true;
                    }
                }
            });
        });

        //On timeout
        // socket.on('timeout', () => {
        //     infoDisplay.innerHTML = 'You have reached the 10 min time limit'
        // });

        //Ready button
        startButton.addEventListener('click', () => {
            if(allShipsPlaced){
                playGameMulti(socket);
            }
            else{
                infoDisplay.innerHTML = "Please place all ships";
            }
        });

        //multiplayer firing
        computerSquares.forEach(square => {
            square.addEventListener('click', () => {
                if(currentPlayer === 'user' && ready && enemyReady){
                    shotFired = square.dataset.id;
                    socket.emit('fire', shotFired);
                }
            });
        });

        //firing received 
        socket.on('fire', id => {
            enemyGo(id);
            const squares = userSquares[id];
            socket.emit('fire-reply', squares.classList);
            playGameMulti(socket);
        });

        //On fire replay received
        socket.on('fire-reply', classList => {
            revealSquare(classList);
            playGameMulti(socket);
        })

        function playerConnectedOrDisconnected(num){
            let player = `.p${parseInt(num) + 1}`;
            console.log(player);
            document.querySelector(`${player} .connected span`).classList.toggle('green');
            if(parseInt(num) === playerNum){
                document.querySelector(player).style.fontWeight = 'bold';
            }
        }
    }

    


    //Singleplayer
    function startSinglePlayer(){
        console.log("hello")
        gameMode = "singlePlayer";

        generate(shipArray[0]);
        generate(shipArray[1]);
        generate(shipArray[2]);
        generate(shipArray[3]);
        generate(shipArray[4]);

        startButton.addEventListener('click', playGameSingle);
    }

    //Creating the board
    function createBoard(grid, squares){
        for(let i = 0; i<width*width; i++){
            const square = document.createElement('div');
            square.dataset.id = i;
            grid.appendChild(square);
            squares.push(square);

        }
    }
    createBoard(userGrid, userSquares);
    createBoard(computerGrid, computerSquares);

    //Ships
    const shipArray = [
        {
            name: 'destroyer', 
            directions: [
                [0,1],
                [0, width]
            ]
        },
        {
            name: 'submarine', 
            directions: [
                [0,1,2],
                [0, width, width*2]
            ]
        },
        {
            name: 'cruiser', 
            directions: [
                [0,1,2],
                [0, width, width*2]
            ]
        },
        {
            name: 'battleship', 
            directions: [
                [0,1,2,3],
                [0, width, width*2, width*3]
            ]
        },
        {
            name: 'carrier', 
            directions: [
                [0,1,2,3,4],
                [0, width, width*2, width*3, width*4]
            ]
        }
    ];

    //Draw the computer ships in random locations
    function generate(ship){
        let randomDirection = Math.floor(Math.random() * ship.directions.length);
        let current = ship.directions[randomDirection];
        if(randomDirection === 0 ){
            direction = 1;
        }
        if(randomDirection === 1){
            direction = 10;
        }
        let randomStart = Math.abs(Math.floor(Math.random() * computerSquares.length - ship.directions[0].length * direction));
        const isTaken = current.some(index => computerSquares[randomStart + index].classList.contains('taken'));
        const isAtRightEdge = current.some(index => (randomStart + index) % width === width-1);
        const isAtLeftEdge = current.some(index => (randomStart + index) % width === 0);

        if(!isTaken && !isAtLeftEdge && !isAtRightEdge){
            current.forEach(index => computerSquares[randomStart + index].classList.add('taken', ship.name));

        }
        else{
            generate(ship)
        }
    }



    //rotate function
    function rotate(){
        if(isHorizontal != !isHorizontal){
            destroyer.classList.toggle('destroyer-container-vertical');
            submarine.classList.toggle('submarine-container-vertical');
            cruiser.classList.toggle('cruiser-container-vertical');
            battleship.classList.toggle('battleship-container-vertical');
            carrier.classList.toggle('carrier-container-vertical');
            isHorizontal = !isHorizontal;
            return
        }
    }
    rotateButton.addEventListener('click', rotate);

    //move ships 
    ships.forEach(ship => ship.addEventListener('dragstart', dragStart));
    userSquares.forEach(square => square.addEventListener('dragstart', dragStart));
    userSquares.forEach(square => square.addEventListener('dragover', dragOver));
    userSquares.forEach(square => square.addEventListener('dragenter', dragEnter));
    userSquares.forEach(square => square.addEventListener('dragleave', dragLeave));
    userSquares.forEach(square => square.addEventListener('drop', dragDrop));
    userSquares.forEach(square => square.addEventListener('dragend', dragEnd));

    let selectedShipNameWithIndex;
    let draggedShip;
    let draggedShipLength;

    ships.forEach(ship => ship.addEventListener('mousedown', (e) => {
        selectedShipNameWithIndex = e.target.id;
    }))

    function dragStart(){
        draggedShip = this;
        draggedShipLength = this.childNodes.length;
    }

    function dragOver(e){
        e.preventDefault();
    }

    function dragEnter(e){
        e.preventDefault();
    }

    function dragLeave(){

    }

    function dragDrop(){
        let shipNameWithLastId = draggedShip.lastChild.id;
        let shipClass = shipNameWithLastId.slice(0, -2);

        let lastShipIndex = parseInt(shipNameWithLastId.substr(-1));
        let shipLastId = lastShipIndex + parseInt(this.dataset.id);
        const notAllowedHorrizontal = [0,10,20,30,40,50,60,70,80,90,1,11,21,31,41,51,61,71,81,91,2,12,22,32,42,52,62,72,82,92,3,13,23,33,43,53,63,73,83,93];
        const notAllowedVertical = [99,98,97,96,95,94,93,92,91,90,89,88,87,86,85,84,83,82,81,80,79,78,77,76,75,74,73,72,71,70,69,68,67,66,65,64,63,62,61,60];        
        let newNotAllowedHorrizontal = notAllowedHorrizontal.splice(0, 10 * lastShipIndex);
        let newNotAllowedVertical = notAllowedVertical.splice(0, 10 * lastShipIndex);
        selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1));
        

        shipLastId = shipLastId - selectedShipIndex;

        if(isHorizontal && !newNotAllowedHorrizontal.includes(shipLastId)){
            for(let i = 0; i<draggedShipLength; i++){
                userSquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.add('taken', shipClass);
            }
        }
        else if(!isHorizontal && !newNotAllowedVertical.includes(shipLastId)){
            for(let i = 0; i<draggedShipLength; i++){
                userSquares[parseInt(this.dataset.id) -selectedShipIndex + width*i].classList.add('taken', shipClass);
            }
        }
        else{
            return;
        }
        displayGrid.removeChild(draggedShip);
        if(!displayGrid.querySelector('.ship')){
            allShipsPlaced = true;
        }
    }
    function dragEnd(){

    }

    //Game logic for multiplayer
    function playGameMulti(socket){
        if(isGameOver){
            return;
        }
        if(!ready){
            socket.emit('player-ready');
            ready = true;
            playerReady(playerNum);
        }
        if(enemyReady){
            if(currentPlayer === 'user'){
                turnDisplay.innerHTML = "Your Go";
            }
            if(currentPlayer === 'enemy'){
                turnDisplay.innerHTML = "Enemy's Go";
            }
        }
    }

    function playerReady(num){
        let player = `.p${parseInt(num)+ 1}`;
        document.querySelector(`${player} .ready span`).classList.toggle('green');
    }

    //Game Logic for single player
    function playGameSingle(){
        if(isGameOver){
            return;
        }
        if(currentPlayer === 'user'){
            turnDisplay.innerHTML = 'Your Go';
            computerSquares.forEach(square => square.addEventListener('click', function (e){
                shotFired = square.dataset.id;
                revealSquare(square.classList);
            }))
        }
        if(currentPlayer === 'enemy'){
            turnDisplay.innerHTML = 'Computer Go';
            setTimeout(enemyGo, 1000);
        }
    }
    

    let destroyerCount = 0;
    let submarineCount = 0;
    let cruiserCount = 0;
    let battleshipCount = 0;
    let carrierCount = 0;

    function revealSquare(classList){
        console.log(classList);
        const enemySquare = computerGrid.querySelector(`div[data-id='${shotFired}']`);
        const obj = Object.values(classList);
        if(!enemySquare.classList.contains('boom') && currentPlayer === 'user' && !isGameOver){
            if(obj.includes('destroyer')){
                destroyerCount++;
            }
            if(obj.includes('submarine')){
                submarineCount++;
            }
            if(obj.includes('cruiser')){
                cruiserCount++;
            }
            if(obj.includes('battleship')){
                battleshipCount++;
            }
            if(obj.includes('carrier')){
                carrierCount++;
            }
        }
        
        if(obj.includes('taken')){
            enemySquare.classList.add('boom');
            console.log('boom');
        }
        else{
            enemySquare.classList.add('miss');
        }
        checkForWin()
        currentPlayer = 'enemy';
        if(gameMode === 'singlePlayer'){
            playGameSingle();
        }
        
    }

    let cpuDestroyerCount = 0;
    let cpuSubmarineCount = 0;
    let cpuCruiserCount = 0;
    let cpuBattleshipCount = 0;
    let cpuCarrierCount = 0;

    function enemyGo(square){
        if(gameMode === 'singlePlayer') {
            square = Math.floor(Math.random() * userSquares.length);
        }
        if(!userSquares[square].classList.contains('boom')){
            userSquares[square].classList.add('boom');
            if(userSquares[square].classList.contains('destroyer')){
                cpuDestroyerCount++;
            }
            if(userSquares[square].classList.contains('submarine')){
                cpuSubmarineCount++;
            }
            if(userSquares[square].classList.contains('cruiser')){
                cpuCruiserCount++;
            }
            if(userSquares[square].classList.contains('battleship')){
                cpuBattleshipCount++;
            }
            if(userSquares[square].classList.contains('carrier')){
                cpuCarrierCount++;
            } 
        }
        else if (gameMode === 'singlePlayer')
        {
            enemyGo();
        }
        currentPlayer = 'user';
        turnDisplay.innerHTML = 'Your Go';
    }

    function checkForWin(){
        if(destroyerCount === 2){
            infoDisplay.innerHTML = 'You sunk the enemys destroyer';
            destroyerCount = 10;
        }
        if(submarineCount === 3){
            infoDisplay.innerHTML = 'You sunk the enemys submarine';
            submarineCount = 10;
        }
        if(cruiserCount === 3){
            infoDisplay.innerHTML = 'You sunk the enemys cruiser';
            cruiserCount = 10;
        }
        if(battleshipCount === 4){
            infoDisplay.innerHTML = 'You sunk the enemys battleship';
            battleshipCount = 10;
        }
        if(carrierCount === 5){
            infoDisplay.innerHTML = 'You sunk the enemys carrier';
            carrierCount = 10;
        }
        if(destroyerCount + submarineCount + cruiserCount + battleshipCount + carrierCount === 50){
            infoDisplay.innerHTML = 'YOU WIN!';
            gameOver();
        }

        //checking for computers win
        if(cpuDestroyerCount === 2){
            infoDisplay.innerHTML = 'Enemy sunk your destroyer';
            cpuDestroyerCount = 10;
        }
        if(cpuSubmarineCount === 3){
            infoDisplay.innerHTML = 'Enemy sunk your submarine';
            cpuSubmarineCount = 10;
        }
        if(cpuCruiserCount === 3){
            infoDisplay.innerHTML = 'Enemy sunk your cruiser';
            cpuCruiserCount = 10;
        }
        if(cpuBattleshipCount === 4){
            infoDisplay.innerHTML = 'Enemy sunk your battleship';
            cpuBattleshipCount = 10;
        }
        if(cpuCarrierCount === 5){
            infoDisplay.innerHTML = 'Enemy sunk your carrier';
            cpuCarrierCount = 10;
        }

        if(cpuDestroyerCount + cpuSubmarineCount + cpuCruiserCount + cpuBattleshipCount + cpuCarrierCount === 50){
            infoDisplay.innerHTML = 'YOU LOSE!';
            gameOver();
        }

        
    }

    function gameOver(){
        isGameOver = true;
        startButton.removeEventListener('click', playGameSingle);
    }


});
