import { useEffect, useRef, useState } from 'react'
import './App.css'
import { FRUITS_BASE } from './Info.js'

export default function App() {
  // Refs
  const sceneRef = useRef(null);
  const worldRef = useRef(null);
  const canvasRef = useRef(null);

  // Matter.js
  const Engine = Matter.Engine;
  const Render = Matter.Render;
  const World = Matter.World;
  const Bodies = Matter.Bodies;
  const Runner = Matter.Runner;
  const Body = Matter.Body;

  // game statea
  let currentBody = null;
  let currentFruit = null;
  let lockAction = false;
  let interval = null;
  let isDragging = false;
  let [score, setScore] = useState(0);
  let [topScore, setTopScore] = useState(0);
  let [Deque, setDeque] = useState([]);
  let Suika = 0;



  useEffect(() => {
    // init score
    setScore(0);
    setDeque([getRandomFruit(), getRandomFruit(), getRandomFruit(), getRandomFruit()]);
    setTopScore(sessionStorage.getItem('topScore') || 0);

    const engine = Engine.create();
    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      canvas: canvasRef.current,
      // game 430 * 754
      options: {
        width: 430,
        height: 754,
        wireframes: false,
        background: '#f4f4c8',
      },
    });

    const world = engine.world;
    worldRef.current = world;

    // create walls
    const LeftWall = Bodies.rectangle(5, 362, 10, 724, { isStatic: true, render: { fillStyle: '#E6B143' } });
    const RighthWall = Bodies.rectangle(425, 362, 10, 724, { isStatic: true, render: { fillStyle: '#E6B143' } });
    const Ground = Bodies.rectangle(215, 720, 430, 60, { isStatic: true, render: { fillStyle: '#E6B143' } });

    // top Line
    const topLine = Bodies.rectangle(215, 150, 430, 2, { name: "topLine", isStatic: true, isSensor: true, render: { fillStyle: '#E6B143' } });

    World.add(engine.world, [LeftWall, RighthWall, Ground, topLine]);

    Runner.run(engine);
    Render.run(render);


    //check collision
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((collision) => {

        // Fruit : if same index then delete and create hight index
        if (collision.bodyA.index === collision.bodyB.index) {

          const index = collision.bodyA.index;

          // max index
          if (index === FRUITS_BASE.length - 1) {
            return;
          }

          World.remove(world, [collision.bodyA, collision.bodyB]);
          // add score
          let score = (index + 1) * 10;
          setScore((prevScore) => prevScore + score);
          const newfruit = FRUITS_BASE[index + 1];
          const newbody = Bodies.circle(
            collision.collision.supports[0].x,
            collision.collision.supports[0].y,
            newfruit.radius,
            {
              index: index + 1,
              render: {
                sprite: {
                  texture: `/${newfruit.name}.png`,
                },
              },
              restitution: 0.2,
              isSleeping: false
            });
          // next fruit
          World.add(world, newbody);

          // check Suika
          if (index + 1 === FRUITS_BASE.length - 1) {
            Suika++;
          }
          if (Suika === 2) {
            setTimeout(() => {
              alert("game clear!");
              lockAction = true;
            }, 1000);
          }
        }

        // top line
        else if (!lockAction && (collision.bodyA.name === "topLine" || collision.bodyB.name === "topLine")) {
          console.log(collision);
          console.log(collision.bodyA.name + " / " + collision.bodyB.name);
          alert("game over");
        }
      });
    });

    // set first fruit
    addFruit();

    //const interval = setInterval(executeFunction, 1500);
    window.addEventListener('mousemove', MouseMove);
    window.addEventListener('mouseup', MouseUpOrTouchEnd);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('touchmove', TouchMove);
    window.addEventListener('touchend', MouseUpOrTouchEnd);

    // clean up
    return () => {
      Render.stop(render);
      World.clear(world);
      Engine.clear(engine);
      render.canvas.remove();
      render.textures = {};
      window.removeEventListener('mousemove', MouseMove);
      window.removeEventListener('mouseup', MouseUpOrTouchEnd);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('touchmove', TouchMove);
      window.removeEventListener('touchend', MouseUpOrTouchEnd);
    };

  }, []); // 시작시 실행

  //------------------------------------------------------------
  // useEffect
  // score update
  useEffect(() => {
    if (score > topScore) {
      setTopScore(score);
      // save on sessionStorage
      sessionStorage.setItem('topScore', score);
    }
  }, [score]);
  
  useEffect(() => {
    console.log("Deque");
    console.log(Deque);
  }, [Deque]);

  useEffect(() => {
    if (isDragging) {
      console.log("isDragging");
    }
  }, [isDragging]);

  //------------------------------------------------------------
  // functions
  // getFruit
  const getFruit = (index) => {
    return FRUITS_BASE[index];
  }
  const getRandomFruit = () => {
    return getFruit(Math.floor(Math.random() * 5));
  }
  // addFruit
  const addFruit = () => {
    setDeque((prevDeque) => {
      let nowDeque = [...prevDeque];
      //const index = Math.floor(Math.random() * 5;
      //const fruit = FRUITS_BASE[index];
      //const fruit = getFront();
      const fruit = nowDeque[0];
      // create
      const body = Bodies.circle(300, 70, fruit.radius, {
        index: fruit.index,
        isSleeping: true,
        render: {
          sprite: { texture: `/${fruit.name}.png`, },
        },
        restitution: 0.2,
      });

      currentBody = body;
      currentFruit = fruit;
      //addBack(getRandomFruit());
      setDeque([...nowDeque.slice(1), getRandomFruit()]);
      World.add(worldRef.current, body);
    });
  }

  const dropFruit = () => {
    if (lockAction) return;
    currentBody.isSleeping = false;
    lockAction = true;
    setTimeout(() => {
      addFruit();
      lockAction = false;
    }, 1000);
  };

  // 덱의 앞쪽에 요소 추가 (addFront)
  const addFront = (value) => {
    setDeque((prevDeque) => [value, ...prevDeque]);
  };

  // 덱의 뒤쪽에 요소 추가 (addBack)
  const addBack = (value) => {
    console.log("addBack");
    setDeque((prevDeque) => {
      let nowDeque = [...prevDeque];
      console.log(nowDeque);
      setDeque([value, ...nowDeque]);
    });
  };

  // 덱의 앞쪽에서 요소 제거 (removeFront)
  const getFront = () => {
    console.log("getFront");
    setDeque((prevDeque) => {
      let nowDeque = [...prevDeque];
      console.log(nowDeque);
      if (nowDeque.length === 0) {
        //addFront(getRandomFruit());
      }
      nowDeque = [...prevDeque];
      let first = nowDeque[0];
      setDeque(nowDeque.slice(1));
      console.log("first");
      console.log(first);
      return first;
    });
  };

  //------------------------------------------------------------
  // mouse event
  const onMouseDown = (event) => {
    isDragging = true;
    let targetX = event.clientX;
    updateFruitPosition(targetX);
  };
  const updateFruitPosition = (x) => {
    if (currentBody && !lockAction) {
      // 현재 X 좌표를 업데이트
      console.log("updateFruitPosition :" + x);
      const newX = Math.max(10 + currentFruit.radius, Math.min(x, 420 - currentFruit.radius));
      Body.setPosition(currentBody, { x: newX, y: currentBody.position.y });
    }
  };

  // 마우스가 눌린 상태일 때만 목표 위치 업데이트
  const MouseMove = (event) => {
    if (isDragging) {
      let targetX = event.clientX;
      updateFruitPosition(targetX);
    }
  };


  // 마우스가 눌린 상태일 때만 목표 위치 업데이트
  const TouchMove = (event) => {
    if (isDragging) {
      let targetX = event.clientX;
      updateFruitPosition(targetX);
    }
  };


  // 마우스를 떼거나 터치가 종료되면 과일을 떨어뜨림
  const MouseUpOrTouchEnd = () => {
    isDragging = false;
    dropFruit();
  };


  return (
    <div className='BG'>

      <div ref={sceneRef}>
        <canvas ref={canvasRef}></canvas>
      </div>
      <div>
        <div className='scoreBoard'>
          <p>SCORE  <br></br> {score}</p>
          <p>TOP SCORE  <br></br>{topScore}</p>
        </div>
        <div className='preview'>
          <p> NEXT</p>
          {Deque && Deque.length > 0 && (
            <div className="image-list">
              {Deque.map((item, index) => (
                <div key={index} className="nextContainer">
                  <p>{index}</p>
                  <img className="nextImg" src={`/${item.name}.png`} alt={`nextImg-${index}`} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

