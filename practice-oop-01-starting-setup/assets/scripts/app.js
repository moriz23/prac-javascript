class DOMHelper {
  static clearEventListeners(element) {
    const clonedElement = element.cloneNode(true);
    element.replaceWith(clonedElement);
    return clonedElement;
  }
  static moveElement(elementId, newDestinationSelector) {
    const element = document.getElementById(elementId);
    const destinationSelector = document.querySelector(newDestinationSelector);
    destinationSelector.append(element);
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

class Component {
  constructor(hostElementId, insertBefore = false) {
    if (hostElementId) {
      this.hostElement = document.getElementById(hostElementId);
    } else {
      this.hostElement = document.body;
    }
    this.insertBefore = insertBefore;
  }
  detach() {
    if (this.element) {
      this.element.remove();
    }
  }
  attach() {
    this.hostElement.insertAdjacentElement(
      this.insertBefore ? 'afterbegin' : 'beforeend',
      this.element
    );
  }
}

class Tooltip extends Component {
  constructor(closeNotifierFunction, text, hostElementId) {
    super(hostElementId);
    this.closeNotifier = closeNotifierFunction;
    this.text = text;
    this.create();
  }
  closeToolTip = () => {
    this.detach();
    this.closeNotifier();
  };

  create() {
    const tooltipElement = document.createElement('div');
    tooltipElement.className = 'card';
    const tooltipTemplate = document.getElementById('tooltip');
    const tooltipBody = document.importNode(tooltipTemplate.content, true);
    tooltipBody.querySelector('p').textContent = this.text;
    tooltipElement.append(tooltipBody);

    const hostElPosLeft = this.hostElement.offsetLeft;
    const hostElPosTop = this.hostElement.offsetTop;
    const hostElHeight = this.hostElement.clientHeight;
    const parentElementScrolling = this.hostElement.parentElement.scrollTop;

    const x = hostElPosLeft + 20;
    const y = hostElPosTop + hostElHeight - parentElementScrolling - 10;

    tooltipElement.style.position = 'absolute';
    tooltipElement.style.left = x + 'px';
    tooltipElement.style.top = y + 'px';

    this.element = tooltipElement;
    tooltipElement.addEventListener('click', this.closeToolTip);
  }
}

class ProjectItem {
  hasActiveTooltip = false;
  constructor(id, updateProjectsListsFunction, type) {
    this.id = id;
    this.updateProjectsListsHandler = updateProjectsListsFunction;
    this.connectMoreInfoButton();
    this.connectSwitchButton(type);
    this.connectDrag();
  }

  showMoreInforHandler() {
    if (this.hasActiveTooltip) {
      return;
    }
    const projectElement = document.getElementById(this.id);
    const tooltipText = projectElement.dataset.extraInfo;
    console.log(projectElement.dataset);
    projectElement.dataset.someInfo = 'Test';
    const tooltip = new Tooltip(
      () => {
        this.hasActiveTooltip = false;
      },
      tooltipText,
      this.id
    );
    tooltip.attach();
    this.hasActiveTooltip = true;
  }

  connectDrag() {
    document.getElementById(this.id).addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('text/plain', this.id);
      event.dataTransfer.effectAllowed = 'move';
    });
  }

  connectMoreInfoButton() {
    const projItemElement = document.getElementById(this.id);
    const moreInfoBtn = projItemElement.querySelector('button:first-of-type');
    moreInfoBtn.addEventListener('click', this.showMoreInforHandler.bind(this));
  }

  connectSwitchButton(type) {
    const projItemElement = document.getElementById(this.id);
    let switchBtn = projItemElement.querySelector('button:last-of-type');
    switchBtn = DOMHelper.clearEventListeners(switchBtn);
    switchBtn.textContent = type === 'active' ? 'Finish' : 'Activate';
    switchBtn.addEventListener(
      'click',
      this.updateProjectsListsHandler.bind(null, this.id)
    );
  }

  update(updateProjectsListsFn, type) {
    this.updateProjectsListsHandler = updateProjectsListsFn;
    this.connectSwitchButton(type);
  }
}

class ProjectList {
  projects = [];
  constructor(type) {
    this.type = type;
    const prjItems = document.querySelectorAll(`#${type}-projects li`);
    for (const prjItem of prjItems) {
      this.projects.push(
        new ProjectItem(prjItem.id, this.switchProject.bind(this), this.type)
      );
    }
    console.log(this.projects);
    this.connectDroppable();
  }

  connectDroppable() {
    const list = document.querySelector(`#${this.type}-projects ul`);

    list.addEventListener('dragenter', (event) => {
      if (event.dataTransfer.types[0] === 'text/plain') {
        event.preventDefault();
        list.parentElement.classList.add('droppable');
      }
    });

    list.addEventListener('dragover', (event) => {
      if (event.dataTransfer.types[0] === 'text/plain') {
        event.preventDefault();
      }
    });

    list.addEventListener('dragleave', (event) => {
      if (event.relatedTarget.closest(`#${this.type}-projects ul`) !== list) {
        list.parentElement.classList.remove('droppable');
      }
    });

    list.addEventListener('drop', (event) => {
      const prjId = event.dataTransfer.getData('text/plain');
      if (
        this.projects.find((p) => {
          p.id === prjId.id;
        })
      ) {
        return;
      }
      document
        .getElementById(prjId)
        .querySelector('button:last-of-type')
        .click();
      list.parentElement.classList.remove('droppable');
      event.preventDefault();
    });
  }

  setSwitchHandler(switchHandlerFunction) {
    this.switchHandler = switchHandlerFunction;
  }

  addProject(project) {
    this.projects.push(project);
    DOMHelper.moveElement(project.id, `#${this.type}-projects ul`);
    project.update(this.switchProject.bind(this), this.type);
  }

  switchProject(projectId) {
    this.switchHandler(this.projects.find((p) => p.id === projectId));
    this.projects = this.projects.filter((p) => p.id !== projectId);

    // projectListArray = this.projects;
    // this.projects = this.projects.filter((p, index, projectListArray) => {
    //   return p.id !== projectId;
    // });
    // this.switchHandler(this.projects.find((p, index, projectListArray) => {
    //   return p.id === projectId;
    // }));
  }
}

class App {
  static init() {
    const activeProjectList = new ProjectList('active');
    const finishedProjectList = new ProjectList('finished');
    activeProjectList.setSwitchHandler(
      finishedProjectList.addProject.bind(finishedProjectList)
    );
    finishedProjectList.setSwitchHandler(
      activeProjectList.addProject.bind(activeProjectList)
    );

    // const timerId = setTimeout(this.startAnalytics, 3000);
  }

  // static startAnalytics() {
  //   const analyticsScript = document.createElement('script');
  //   analyticsScript.src = 'assets/scripts/analytics.js';
  //   analyticsScript.defer = true;
  //   document.head.append(analyticsScript);
  // }
}

App.init();
