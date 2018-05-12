nodejs-simple-file-server
=========================

a basic file server written in nodejs


Allowed operations:
<ul>
	<li>GET --> /job --> return the list of active jobs</li>
	<li>POST --> /job/new --> create a new job and return the id</li>
	<li>GET --> /job/:job-id/state --> return job state (ready/uploading/uploaded/copied)</li>
	<li>POST --> /job/:job-id/state/uploaded --> change the job state to uploaded</li>
	<li>POST --> /job/:job-id/state/copied --> change the job state to copied</li>
	<li>GET --> /job/:job-id/upload --> return list of files uploaded</li>
	<li>POST --> /job/:job-id/upload {name: <i>fileName</i>, content: <i>fileContent</i>} --> upload a file in server</li>
	<li>GET --> /job/:job-id/file/:file-name --> return requested file</li>
</ul>

A configurable clean job periodically check and delete old job

Added extra lines..!!s
Something changed
