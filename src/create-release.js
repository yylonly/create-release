const core = require('@actions/core');
const { GitHub, context } = require('@actions/github');
const fs = require('fs');
const console = require('console');

async function run() {
  try {
    // Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
    const github = new GitHub(process.env.GITHUB_TOKEN);

    // const { ownercontext, repocontext } = context.repo;
    //
    // // Get owner and repo from workflows
    // const ownerworkflow = 'aa';
    // const repoworkflow = 'bb';

    const ownerworkflow = core.getInput('owner');
    const repoworkflow = core.getInput('repo');
    //

    // const { owner, repo } = { owner: ownerworkflow, repo: repoworkflow };
    const { owner, repo } =
      ownerworkflow === undefined || repoworkflow === undefined
        ? context.repo
        : { owner: ownerworkflow, repo: repoworkflow };

    // const { owner, repo } = context.repo;

    // Get owner and repo from context of payload that triggered the action

    // Get the inputs from the workflow file: https://github.com/actions/toolkit/tree/master/packages/core#inputsoutputs
    const tagName = core.getInput('tag_name', { required: true });

    // This removes the 'refs/tags' portion of the string, i.e. from 'refs/tags/v1.10.15' to 'v1.10.15'
    const tag = tagName.replace('refs/tags/', '');
    const releaseName = core.getInput('release_name', { required: false }).replace('refs/tags/', '');
    const body = core.getInput('body', { required: false });
    const draft = core.getInput('draft', { required: false }) === 'true';
    const prerelease = core.getInput('prerelease', { required: false }) === 'true';
    const commitish = core.getInput('commitish', { required: false }) || context.sha;

    const bodyPath = core.getInput('body_path', { required: false });
    let bodyFileContent = null;
    if (bodyPath !== '' && !!bodyPath) {
      try {
        bodyFileContent = fs.readFileSync(bodyPath, { encoding: 'utf8' });
      } catch (error) {
        core.setFailed(error.message);
      }
    }
    console.log('print owner and repo:');
    console.log(owner);
    console.log(repo);

    console.log('print ownerworkflow and repoworkflow:');
    console.log(ownerworkflow);
    console.log(repoworkflow);

    console.log('tag is:');
    console.log(tag);

    // console.log('print ownercontext and repocontext:');
    // console.log(ownercontext);
    // console.log(repocontext);
    // Create a release
    // API Documentation: https://developer.github.com/v3/repos/releases/#create-a-release
    // Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-create-release
    const createReleaseResponse = await github.repos.createRelease({
      owner,
      repo,
      tag_name: tag,
      name: releaseName,
      body: bodyFileContent || body,
      draft,
      prerelease,
      target_commitish: commitish
    });

    // Get the ID, html_url, and upload URL for the created Release from the response
    const {
      data: { id: releaseId, html_url: htmlUrl, upload_url: uploadUrl }
    } = createReleaseResponse;

    // Set the output variables for use by other actions: https://github.com/actions/toolkit/tree/master/packages/core#inputsoutputs
    core.setOutput('id', releaseId);
    core.setOutput('html_url', htmlUrl);
    core.setOutput('upload_url', uploadUrl);
  } catch (error) {
    core.setFailed(error.message);
  }
}

module.exports = run;
