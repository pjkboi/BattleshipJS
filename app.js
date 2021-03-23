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
    const userSquares = [];
    const computerSquares = [];
    let isHorizontal = true;
    const width = 10;


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

    generate(shipArray[0]);
    generate(shipArray[1]);
    generate(shipArray[2]);
    generate(shipArray[3]);
    generate(shipArray[4]);

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
        console.log(draggedShip)
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
        const notAllowedHorrizontal = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 1, 11, 21, 31, 41, 51, 61, 71, 81, 91]
        selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1));

        shipLastId = shipLastId - selectedShipIndex;

        if(isHorizontal){
            for(let i = 0; i<draggedShipLength; i++){
                userSquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.add('taken', shipClass);
            }
        }
        else if(!isHorizontal){
            for(let i = 0; i<draggedShipLength; i++){
                userSquares[parseInt(this.dataset.id) -selectedShipIndex + width*i].classList.add('taken', shipClass);
            }
        }
        else{
            return;
        }
        displayGrid.removeChild(draggedShip);
    }
    function dragEnd(){

    }
});
