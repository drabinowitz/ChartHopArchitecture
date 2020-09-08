We’re rendering tiers of a tree structure
We’ve got a single manager
For each user there’s going to be 1 or 0 managers
Backfill is an empty position that we want to keep in our org chart
entities 
Jobs
Title (eg SVP of Engineering)
Category (eg Engineering)
People
Name
Job
Job doesn’t necessarily have a person tied to it, like in the case of a backfill

Tables
People
Hash key be the organization id
Range key on the user id
Name string
JobID key
GSI on the jobID for the user mapping to the userID, and userName

Jobs
Hash key on the organization id
Range key on the job id
Name string
Category string (may be worth building a GSI on category if we wanna lookup by that)
Manager id or null
This is the id of the job that manages this job or null if this job has no manager
GSI on the managerID for a job and that will map to a job

type Job {
  ID string
  name string
  category string
  managerID string | null
}

type Person {
  ID string
  name string
  jobID string
}

/jobs/csuite POST
- input
  - name (required)
  - category (required)
- implementation
  - insert job under organization hash, job range
  - separate insert job under organization hash, fixed range key c_# (we should be too use a query on dynamo to grab the most recent c_# and then increment the id attached there, alternatively we could just have 1 c level we just insert under our fixed key if it's not already present)

/jobs POST
- input
  - name string (required)
  - category string (required)
  - managerID string (required) another job id
- output
  - ID string (app generated ksuid)
  - name string
  - category string
  - managerID string

/jobs/{ID} PUT
- input
  - ID string (required)
  - name string (optional)
  - category string (optional)
  - managerID string (optional)
- output
  - ID string (app generated ksuid)
  - name string
  - category string
  - managerID string

/jobs/{ID} GET
- input ID
- output Job

/people POST
- input
  - name string (required)
  - jobID string (required)
- output
  - ID string (app generated ksuid)
  - name string
  - jobID string

/people/{ID} PUT
- input
  - ID string (required)
  - name string (required)
  - jobID string (required)
- output
  - ID string (app generated ksuid)
  - name string
  - jobID string

/people/{ID} GET
- input ID
- output Person

/people/tree?topJobID=string&tiers=number GET
- input
  - toJobID string (optional)
    - if not specified, defaults to top manager of company using the fixed range key
  - tiers number (optional), default=3, min=1, max=5
- output
  - TreeNode
    - person Person | null
    - job Job
    - children TreeNode[]
- implementation
  - we get the top job id or csuite
  - we then lookup all jobs that are managed by the given job through our GSI on managerID 
  - and then we repeat this query with the next tier of jobs until we hit our target tier count
  - we need to lookup users in the organization based on the jobs we just queried
  - we perform a query on users by the jobIDs in our tree using the GSI mapping jobID to userID and user name
  - we then have all the information needed for our tree
  - so we can generate the tree structure, leaving all empty persons for a given job as a backfill role, and return it

implementing our tree generation
- separately fetch users and jobs
- we can then on the frontend create a map from jobID to person with the loaded people
- we can create a map on the frontend from jobID to job
- we then went a grouping map from jobID to all ids of jobs managed by that job
- if we iterate through our jobs and look for the top level (no managerID or managerID not in map)
- place that user as top of org chart
- iterate through the those user(s)
- get all jobs managed by those users
- render them as the next layer in our org chart
- and then repeat for each job in that layer until we no longer get any responses when looking up managed by users