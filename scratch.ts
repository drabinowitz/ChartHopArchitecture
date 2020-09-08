async function buildTree ({companyID, tiers, topJobID}: {companyID: string; tiers: number; topJobID?: string}): TreeNode {
  const topJob = await topJobID == null ? dao.getTopJOB(companyID) : dao.getJob(companyID, topJobID);

  const tree = {
    job: topJob,
    children: [],
  }

  let jobsToQuery = [tree];

  const allJobs = 

  for (count of tiers) {
    const nextTier = await dao.getJobsManagedBy(...jobsToQuery);

    const nextLeaves = [];

    nextTier.forEach(job => {
      jobsToQuery.forEach(parentJob => {
        if job.managerID === parentJob.id {
          const leaf = {
            job, 
            children: [],
          };

          parentJob.children.push(leaf);

          nextLeaves.push(leaf);
        }
      })
    })

    jobsToQuery = nextLeaves;
  }

  const users = await userDAO.getUserByJobs()

  return tree;
}