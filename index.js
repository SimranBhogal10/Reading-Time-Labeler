const core = require('@actions/core');
const github = require('@actions/github');

async function addEstimatedTimeLabel(){
    try {
        const eventName = github.context.eventName;
        if (!eventName.includes("pull_request"))
            throw new Error(`This action is intended to run only on pull_request events, not on ${eventName} events.`
        );

        const octokit = github.getOctokit(core.getInput("GITHUB_TOKEN"));
        const owner = github.context.payload.repository.owner.login;
        const repo = github.context.payload.pull_request.base.repo.name;
        const pullRequestNumber = github.context.payload.pull_request.number;

        const parameters = {
            owner,
            repo,
            pull_number: pullRequestNumber,
        };

        let noOfFilesChanged = await getNumberOfFilesChanged(parameters);

        let estimatedTimeTaken = await getReadingTime(noOfFilesChanged);

        let response = await octokit.rest.pulls.addLabels({
            ...parameters,
            labels: estimatedTimeTaken,
          });
        if (response) core.info(`Response => ${JSON.stringify(response)}`);
    } 
    catch (e) {

    core.setFailed(e.message);

  }
}

async function getNumberOfFilesChanged(parameters){
  const listFilesOptions = await octokit.rest.pulls.listFiles.endpoint.merge({
    parameters
  });

  const listFilesResponse = await octokit.paginate(listFilesOptions);
  const changedFiles = listFilesResponse.map((item) => item.filename);

  return changedFiles.length;
}

async function getReadingTime(noOfFilesChanged){
    let averageReadingTimePerPage = 10;

    let totalReadingTime = averageReadingTimePerPage * noOfFilesChanged;

    let formattedReadingTime = await formatDuration(totalReadingTime);

    console.log(formattedReadingTime);
    return formattedReadingTime;

}

async function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  minutes = minutes % 60;

  const formattedHours = minutes > 30 ? hours + 1 : hours;

  return `${formattedHours} hours`;
}

addEstimatedTimeLabel();
