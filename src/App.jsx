import { useEffect, useRef, useState } from 'react'
import './App.css'
import { FRUITS_BASE, FRUITS_ITEM } from './Info.js'
//import SE from './assets/effect.mp3'
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
  let [holdIndex, setHold] = useState(-1); // 홀드한 과일 인덱스
  let canHold = useRef(false); // 홀드 가능 여부
  let canBoom = useRef(true); // 폭탄 사용 가능 여부
  let [boomCnt, setBoom] = useState(3);
  let Suika = 0;
  // sounds
  const effectSound = new Audio('./effect.mp3');
  const boomSound = new Audio('./boom.mp3');
  // Start
  useEffect(() => {
    // 점수 초기화, 시각 과일 초기화
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
    const LeftWall = Bodies.rectangle(5, 362, 10, 724, { name: "leftWall", isStatic: true, render: { fillStyle: '#E6B143' } });
    const RighthWall = Bodies.rectangle(425, 362, 10, 724, { name: "righthWall", isStatic: true, render: { fillStyle: '#E6B143' } });
    const Ground = Bodies.rectangle(215, 720, 430, 60, { name: "ground", isStatic: true, render: { fillStyle: '#E6B143' } });

    // top Line
    const topLine = Bodies.rectangle(215, 150, 430, 2, { name: "topLine", isStatic: true, isSensor: true, render: { fillStyle: '#E6B143' } });

    World.add(engine.world, [LeftWall, RighthWall, Ground, topLine]);

    Runner.run(engine);
    Render.run(render);


    //check collision
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((collision) => {
        const bodyAName = collision.bodyA.name || '';
        const bodyBName = collision.bodyB.name || '';
        // Fruit : 같은 인덱스면 둘을 삭제하고 다음 인덱스 과일 생성
        if (collision.bodyA.index === collision.bodyB.index) {

          const index = collision.bodyA.index;

          // 마지막 과일이상으로 안 넘어가도록
          if (index === FRUITS_BASE.length - 1) {
            return;
          }

          World.remove(world, [collision.bodyA, collision.bodyB]);
          effectSound.play();
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
        // Boom - 충돌이 선이 아니고 둘 중하나가 폭탄이라면
        else if (
          // bodyA와 bodyB 모두 특정 이름이 아닌 경우
          ((bodyAName !== "topLine" && bodyBName !== "topLine") &&
            (bodyAName !== "ground" && bodyBName !== "ground") &&
            (bodyAName !== "leftWall" && bodyBName !== "leftWall") &&
            (bodyAName !== "rightWall" && bodyBName !== "rightWall")) &&
          // bodyA 또는 bodyB의 index가 101(폭탄)인 경우
          (collision.bodyA.index === 100 || collision.bodyB.index === 100)
        ) {
          // 둘다 삭제 후 효과음 재생
          World.remove(world, [collision.bodyA, collision.bodyB]);
          boomSound.play();
        }

        // top line
        else if (!lockAction && (collision.bodyA.name === "topLine" || collision.bodyB.name === "topLine")) {
          lockAction = true;
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
    window.addEventListener('keydown', handleKeyDown);

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
      window.removeEventListener('keydown', handleKeyDown);
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
  const addFruit = (index) => {
    setDeque((prevDeque) => {
      let nowDeque = [...prevDeque];
      //const index = Math.floor(Math.random() * 5;
      //const fruit = FRUITS_BASE[index];
      //const fruit = getFront();
      let fruit;
      if (typeof index !== 'undefined') {
        fruit = getFruit(index);
      }
      else {
        fruit = nowDeque[0];
      }
      // create
      const body = Bodies.circle(300, 70, fruit.radius, {
        index: fruit.index,
        isSleeping: true,
        render: {
          sprite: { texture: `/${fruit.name}.png`, },
        },
        restitution: 0.2,
      });
      // 과일 생성
      currentBody = body;
      currentFruit = fruit;
      if (typeof index !== 'undefined') {
        // 스왑시 리스트 유지
        setDeque([...nowDeque]);
      }
      else {
        // 평시 : 다음 과일 추가
        setDeque([...nowDeque.slice(1), getRandomFruit()]);
      }
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
      canHold.current = true;
      canBoom.current = true;
    }, 1000);
  };

  // hold
  const hold = () => {
    if (!lockAction) {
      setHold((current) => {
        setHold(currentFruit.index);
        World.remove(worldRef.current, currentBody);
        if (current < 0) {
          // 처음 홀드하는 경우
          addFruit();
        }
        else {
          // 이미 과일을 홀드하고 있으면
          addFruit(current);
        }
        canHold.current = false;
      });
    }
  };
  // 현재 과일을 변경
  const changeTemp = (index) => {
    // 현재 과일 없애고 폭탄 생성, 홀드 잠금
    setHold((current) => {
      canHold.current = false;
      World.remove(worldRef.current, currentBody);
      // 모델 생성
      let fruits = null;
      // 과일
      if (index < 100) {
        fruits = FRUITS_BASE[index];
      }
      // 아이템
      else if (index < 200) {
        const reIndex = index % 100;
        fruits = FRUITS_ITEM[reIndex];
        if (index == 100) // 100
        {
          setBoom((prevScore) => prevScore - 1);
        }
      }
      const body = Bodies.circle(300, 70, fruits.radius, {
        index: fruits.index,
        isSleeping: true,
        render: {
          sprite: { texture: `/${fruits.name}.png`, },
        },
        restitution: 0.2,
      });
      // 추가
      currentBody = body;
      World.add(worldRef.current, body);
    });

  }


  //------------------------------------------------------------
  // input event
  const onMouseDown = (event) => {
    isDragging = true;
    let targetX = event.clientX;
    updateFruitPosition(targetX);
  };
  const updateFruitPosition = (x) => {
    if (currentBody && !lockAction) {
      // 현재 X 좌표를 업데이트
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
  // shift로 홀드
  const handleKeyDown = (event) => {
    if (event.key === 'Shift') {
      if (canHold.current) {
        hold();
      }
    }
    else if (event.key === '1') {
      if (canHold.current) {
        changeTemp(100);
      }
    }
  };


  return (
    <div className='BG'>

      <div ref={sceneRef}>
        <canvas ref={canvasRef}></canvas>
      </div>
      <div>
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
        <div className='holdBoard'>
          <p> HOLD (shift)</p>
          {holdIndex >= 0 && (
            <img className="holdImg" src={`/${FRUITS_BASE[holdIndex].name}.png`} />
          )}

        </div>
        <div className='boomBoard'>
          {boomCnt >= 0 &&
            Array.from({ length: boomCnt }).map((_, index) => (
              <img
                key={index}
                className="boomImg"
                src={`/base/100_boom.png`}
                alt={`Boom ${index + 1}`}
              />
            ))}

        </div>
        <div className='scoreBoard'>
          <p>SCORE  <br></br> {score}</p>
          <p>TOP SCORE  <br></br>{topScore}</p>
        </div>
      </div>
    </div>
  );
}

