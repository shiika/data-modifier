import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-uploader',
  templateUrl: './uploader.component.html',
  styleUrls: ['./uploader.component.scss'],
})
export class UploaderComponent implements OnInit {
  form: FormGroup = this.fb.group({
    url: [''],
    name: ['', Validators.required],
    vendor: ['', Validators.required],
    type: ['', Validators.required],
  });
  availableFileFormats: string[] = ['png', 'jpg', 'jpeg', 'pdf'];
  isUpload: boolean = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {}

  onFileUpload(e: Event): void {
    this.isUpload = true;
    const fileSize = e.target['files'][0].size;
    const fileName = e.target['files'][0].name;
    if (this.imageValidator(fileSize, fileName) === null) {
      this.isUpload = false;
      this.form.setErrors(null);
      this.form.get('name').setValue(fileName);

      console.log(e.target['files']);
      // this.attachment
      //   .uploadAttachements(e.target['files'])
      //   .pipe(take(1))
      //   .subscribe((res: any) => {
      //     (this.form.get(`Sample ${id}`).get('images') as FormArray).push(
      //       new FormControl(res.data.attachments[0])
      //     );
      //     this.isUpload = false;
      //   });
    } else {
      this.form.setErrors(this.imageValidator(fileSize, fileName));
    }
  }

  imageValidator(size: number, file: string): ValidationErrors | null {
    const fileName = file.split('.');
    const fileType = fileName[fileName.length - 1];
    if (
      this.availableFileFormats.findIndex((type) => type == fileType) === -1
    ) {
      return { value: 'File type is not supported' };
    }

    return null;
  }
}
