import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { Header } from "../components/Header";
import { url } from "../const";
import "./home.scss";
import moment from "moment";
import "moment/locale/ja"; // 日本語ロケールをインポート

moment.locale("ja");
export const Home = () => {
  const [isDoneDisplay, setIsDoneDisplay] = useState("todo"); // todo->未完了 done->完了
  const [lists, setLists] = useState([]);
  const [selectListId, setSelectListId] = useState();
  const [tasks, setTasks] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [cookies] = useCookies();
  const handleIsDoneDisplayChange = (e) => setIsDoneDisplay(e.target.value);
  const itemsRef = useRef([]);
  useEffect(() => {
    axios
      .get(`${url}/lists`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setLists(res.data);
      })
      .catch((err) => {
        setErrorMessage(`リストの取得に失敗しました。${err}`);
      });
  }, []);

  useEffect(() => {
    const listId = lists[0]?.id;
    if (typeof listId !== "undefined") {
      setSelectListId(listId);
      axios
        .get(`${url}/lists/${listId}/tasks`, {
          headers: {
            authorization: `Bearer ${cookies.token}`,
          },
        })
        .then((res) => {
          setTasks(res.data.tasks);
        })
        .catch((err) => {
          setErrorMessage(`タスクの取得に失敗しました。${err}`);
        });
    }
  }, [lists]);

  const handleSelectList = (id) => {
    setSelectListId(id);
    axios
      .get(`${url}/lists/${id}/tasks`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setTasks(res.data.tasks);
      })
      .catch((err) => {
        setErrorMessage(`タスクの取得に失敗しました。${err}`);
      });
  };

  const handleKeyDown = (event,index) => {
    if (event.key === "Tab") {
      event.preventDefault();
      let nextIndex;
      if (lists.length === index + 1) {
          nextIndex = 0;
        } else {
                nextIndex = index + 1;
            }
          handleSelectList(lists[nextIndex].id);
          itemsRef.current[nextIndex].focus();
    }
  };

  return (
    <div>
      <Header />
      <main className="taskList">
        <p className="error-message">{errorMessage}</p>
        <div>
          <div className="list-header">
            <h2>リスト一覧</h2>
            <div className="list-menu">
              <p>
                <Link to="/list/new" tabIndex={-1}>
                  リスト新規作成
                </Link>
              </p>
              <p>
                <Link to={`/lists/${selectListId}/edit`} tabIndex={-1}>
                  選択中のリストを編集
                </Link>
              </p>
            </div>
            </div>             

          <ul className="list-tab">
            {lists.map((list, key) => {
              const isActive = list.id === selectListId;
              return (
                <li
                  key={key}
                  className={`list-tab-item ${isActive ? "active" : ""}`}
                  onClick={() => handleSelectList(list.id)}
                  ref={(el) => (itemsRef.current[key] = el)}
                  onKeyDown={(event) => handleKeyDown(event, key)}
                  tabIndex={0}
                  role="tab"
                  aria-selected={itemsRef.current[key] === document.activeElement}
                  >
                  {list.title}
                </li>
              );
            })}
          </ul>
          <div className="tasks" tabIndex={-1}>
            <div className="tasks-header">
              <h2>タスク一覧</h2>
              <Link to="/task/new" tabIndex={-1}>
                タスク新規作成
              </Link>
            </div>
            <div className="display-select-wrapper">
              <select
                onChange={handleIsDoneDisplayChange}
                className="display-select"
                tabIndex={-1}
              >
                <option value="todo">未完了</option>
                <option value="done">完了</option>
              </select>
            </div>
            <Tasks
              tasks={tasks}
              selectListId={selectListId}
              isDoneDisplay={isDoneDisplay}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

// 表示するタスク
const Tasks = (props) => {
  const { tasks, selectListId, isDoneDisplay } = props;
  if (tasks === null) return <></>;

  const diffSeconds = (task) => {
    const now = new Date(); // 現在時刻を取得
    const second = (new Date(task.limit) - now) / 1000;
    const minutes = second / 60;
    const hours = minutes / 60;
    const days = hours / 24;

    const remainingDays = Math.floor(days);
    const remainingHours = Math.floor(hours % 24); // 残りの時間
    const remainingMinutes = Math.floor(minutes % 60); // 残りの分

    return (
      <>
        <div className="timelimits">
          残り : {remainingDays}日{remainingHours}時間{remainingMinutes}分
        </div>
      </>
    );
  };
  if (isDoneDisplay == "done") {
    return (
      <ul>
        {tasks

          .filter((task) => {
            return task.done === true;
          })
          .sort((a, b) => new Date(a.limit) - new Date(b.limit))
          .map((task, key) => (
            <li key={key} className="task-item">
              <Link
                to={`/lists/${selectListId}/tasks/${task.id}`}
                className="task-item-link"
                tabIndex={-1}
              >
                <h1>{task.title}</h1>
                <br />
                <div>期日 : {moment(task.limit).format("MMMMDo HH:mm")}</div>
                {diffSeconds(task)}
                {task.done ? "完了" : "未完了"}
              </Link>
            </li>
          ))}
      </ul>
    );
  }
  //未完了の処理 ↓

  return (
    <ul>
      {tasks
        .filter((task) => task.done === false)
        .sort((a, b) => new Date(a.limit) - new Date(b.limit))
        .map((task, key) => (
          <li key={key} className="task-item">
            <Link
              to={`/lists/${selectListId}/tasks/${task.id}`}
              className="task-item-link"
                              tabIndex={-1}

            >
              <h1>{task.title}</h1>
              <br />
              <div>期日 : {moment(task.limit).format("MMMMDo HH:mm")}</div>
              {diffSeconds(task)}
              {/* <br /> */}
              {task.done ? "完了" : "未完了"}
            </Link>
          </li>
        ))}
    </ul>
  );
};
